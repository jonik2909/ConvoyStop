import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import {
  commandSchema,
  destinationSchema,
  DomainError,
  profileSchema,
} from "../../../packages/domain/src/index";
import { Store } from "./store";
const requestIdSchema = z.string().uuid();
const createSchema = z.object({
  requestId: requestIdSchema,
  profile: profileSchema,
  destination: destinationSchema,
  demo: z.boolean().default(false),
});
const joinSchema = z.object({
  requestId: requestIdSchema,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NP-Z2-9]{6}$/),
  profile: profileSchema,
});
const commandBody = z.object({
  requestId: requestIdSchema,
  revision: z.number().int().positive(),
  command: commandSchema,
});
const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export async function buildApp(store: Store, logging = false) {
  const app = Fastify({
    logger: logging,
    bodyLimit: 16384,
    disableRequestLogging: true,
  });
  await app.register(cors, { origin: false });
  await app.register(rateLimit, { max: 180, timeWindow: "1 minute" });
  const sockets = new Map<
    WebSocket,
    { tripId: string; memberId: string; token: string }
  >();
  const ws = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  const broadcast = (tripId: string) => {
    for (const [socket, sub] of sockets)
      if (sub.tripId === tripId && socket.readyState === WebSocket.OPEN) {
        try {
          const { trip } = store.auth(sub.tripId, sub.token);
          socket.send(JSON.stringify({ type: "snapshot", trip }));
        } catch {
          socket.close(4003, "Membership ended");
        }
      }
  };
  const token = (headers: { authorization?: string }) =>
    tokenSchema.parse(headers.authorization?.replace(/^Bearer /, ""));
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof z.ZodError)
      return reply
        .code(400)
        .send({ code: "VALIDATION", message: "Check the entered values" });
    if (error instanceof DomainError)
      return reply
        .code(error.status)
        .send({ code: error.code, message: error.message });
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number(error.statusCode)
        : 500;
    if (statusCode === 429)
      return reply
        .code(429)
        .send({ code: "RATE_LIMIT", message: "Try again shortly" });
    app.log.error(error);
    return reply.code(statusCode).send({
      code: "SERVER_ERROR",
      message: "The request could not be completed",
    });
  });
  app.get("/health", () => ({ ok: true, version: 1 }));
  app.get("/stops", () => ({ stops: store.stops, source: "illustrative" }));
  app.post("/trips", (req) => {
    const t = token(req.headers);
    const body = createSchema.parse(req.body);
    return store.create(
      t,
      body.requestId,
      body.profile,
      body.destination,
      body.demo,
    );
  });
  app.post("/join", (req) => {
    const t = token(req.headers);
    const body = joinSchema.parse(req.body);
    const result = store.join(t, body.requestId, body.code, body.profile);
    broadcast(result.trip.id);
    return result;
  });
  app.get<{ Params: { id: string } }>(
    "/trips/:id",
    (req) => store.auth(req.params.id, token(req.headers)).trip,
  );
  app.post<{ Params: { id: string } }>("/trips/:id/commands", (req) => {
    const body = commandBody.parse(req.body);
    const result = store.command(
      req.params.id,
      token(req.headers),
      body.requestId,
      body.command,
      body.revision,
    );
    broadcast(req.params.id);
    return result;
  });
  app.post<{ Params: { id: string } }>("/trips/:id/demo", (req) => {
    const { action } = z
      .object({ action: z.enum(["approve", "reject", "arrive"]) })
      .parse(req.body);
    const trip = store.demoStep(req.params.id, token(req.headers), action);
    broadcast(trip.id);
    return trip;
  });
  app.server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/sync") {
      socket.destroy();
      return;
    }
    ws.handleUpgrade(request, socket, head, (s) =>
      ws.emit("connection", s, request),
    );
  });
  ws.on("connection", (socket) => {
    const timeout = setTimeout(
      () => socket.close(4001, "Authentication required"),
      5000,
    );
    let subscribed = false;
    socket.on("message", (raw) => {
      if (subscribed) return socket.close(4002, "Already subscribed");
      try {
        const input = z
          .object({
            type: z.literal("subscribe"),
            tripId: z.string().uuid(),
            token: tokenSchema,
          })
          .parse(JSON.parse(raw.toString()));
        const { trip, memberId } = store.auth(input.tripId, input.token);
        subscribed = true;
        clearTimeout(timeout);
        sockets.set(socket, { tripId: trip.id, memberId, token: input.token });
        socket.send(JSON.stringify({ type: "snapshot", trip }));
      } catch {
        socket.close(4003, "Invalid session");
      }
    });
    socket.on("close", () => {
      clearTimeout(timeout);
      sockets.delete(socket);
    });
    socket.on("error", () => socket.close());
  });
  const heartbeat = setInterval(() => {
    for (const s of ws.clients) if (s.readyState === WebSocket.OPEN) s.ping();
  }, 20000);
  heartbeat.unref();
  app.addHook("onClose", async () => {
    clearInterval(heartbeat);
    for (const s of ws.clients) s.terminate();
    ws.close();
  });
  return app;
}
