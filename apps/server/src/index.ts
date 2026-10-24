import { resolve } from "node:path";
import { buildApp } from "./app";
import { Store } from "./store";
import { SeedStopProvider } from "../../../packages/domain/src/stops";
const stops = await new SeedStopProvider().getStops();
const store = new Store(
  process.env.CONVOY_DB ?? resolve(".runtime/convoystop.sqlite"),
  stops,
);
store.prune();
const app = await buildApp(store, true);
const port = Number(process.env.PORT ?? 8787);
await app.listen({ port, host: process.env.HOST ?? "127.0.0.1" });
const cleanup = async () => {
  await app.close();
  store.close();
  process.exit(0);
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
