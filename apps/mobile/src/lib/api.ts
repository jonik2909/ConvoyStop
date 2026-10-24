import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { AppState } from "react-native";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import type { Command, Trip, Stop } from "@convoy/domain";
import { requestId, useSession } from "./session";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5000 },
    mutations: { retry: false },
  },
});
export const useConnection = create<{
  status: "connecting" | "connected" | "offline";
  epoch: number;
  retry: () => void;
  set: (s: "connecting" | "connected" | "offline") => void;
}>((set) => ({
  status: "connecting",
  epoch: 0,
  retry: () => set((s) => ({ epoch: s.epoch + 1 })),
  set: (status) => set({ status }),
}));
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const state = useSession.getState();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 8000);
  try {
    const response = await fetch(`${state.apiUrl}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: abort.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.code ?? "SERVER_ERROR");
    return data;
  } catch (e) {
    if (e instanceof Error && e.message.match(/^[A-Z_]+$/)) throw e;
    throw new Error("NETWORK");
  } finally {
    clearTimeout(timer);
  }
}
export const tripKey = (id?: string) => ["trip", id];
export function acceptTrip(trip: Trip) {
  const current = queryClient.getQueryData<Trip>(tripKey(trip.id));
  if (current && current.revision > trip.revision) return;
  queryClient.setQueryData(tripKey(trip.id), trip);
  useSession.getState().cache(trip);
  void flushHandoff(trip);
}
export function useTrip() {
  const session = useSession((s) => s.session);
  const cached = useSession((s) => s.cached);
  return useQuery({
    queryKey: tripKey(session?.tripId),
    queryFn: async () => {
      const fetched = await request<Trip>(`/trips/${session!.tripId}`);
      const current = queryClient.getQueryData<Trip>(tripKey(session!.tripId));
      const latest =
        current && current.revision > fetched.revision ? current : fetched;
      useSession.getState().cache(latest);
      void flushHandoff(latest);
      return latest;
    },
    enabled: !!session,
    initialData: cached?.id === session?.tripId ? cached : undefined,
    initialDataUpdatedAt: 0,
    refetchInterval: 5000,
  });
}
export function useStops() {
  return useQuery({
    queryKey: ["stops", useSession((s) => s.apiUrl)],
    queryFn: () => request<{ stops: Stop[] }>("/stops"),
    staleTime: 60000,
  });
}
export function useCommand() {
  const session = useSession((s) => s.session);
  return useMutation({
    mutationFn: async (command: Command) => {
      if (useConnection.getState().status !== "connected")
        throw new Error("NETWORK");
      const trip = queryClient.getQueryData<Trip>(tripKey(session?.tripId));
      if (!trip || !session) throw new Error("UNAUTHORIZED");
      return request<Trip>(`/trips/${session.tripId}/commands`, {
        requestId: requestId(),
        revision: trip.revision,
        command,
      });
    },
    onSuccess: acceptTrip,
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: tripKey(session?.tripId),
      });
    },
  });
}
export function useDemo() {
  const session = useSession((s) => s.session);
  return useMutation({
    mutationFn: (action: "approve" | "reject" | "arrive") =>
      request<Trip>(`/trips/${session!.tripId}/demo`, { action }),
    onSuccess: acceptTrip,
  });
}
export function SyncBridge() {
  const session = useSession((s) => s.session);
  const token = useSession((s) => s.token);
  const base = useSession((s) => s.apiUrl);
  const epoch = useConnection((s) => s.epoch);
  useEffect(() => {
    if (!session) return;
    let socket: WebSocket | null = null;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const connect = () => {
      if (stopped || AppState.currentState !== "active") return;
      useConnection.getState().set("connecting");
      const current = new WebSocket(base.replace(/^http/, "ws") + "/sync");
      socket = current;
      current.onopen = () =>
        current.send(
          JSON.stringify({ type: "subscribe", tripId: session.tripId, token }),
        );
      current.onmessage = (e) => {
        if (socket !== current) return;
        try {
          const data = JSON.parse(e.data);
          if (data.type === "snapshot") {
            acceptTrip(data.trip);
            useConnection.getState().set("connected");
            attempt = 0;
          }
        } catch {
          /* Malformed data never replaces cache. */
        }
      };
      current.onclose = () => {
        if (stopped || socket !== current) return;
        useConnection.getState().set("offline");
        timer = setTimeout(connect, Math.min(15000, 1000 * 2 ** attempt++));
      };
      current.onerror = () => current.close();
    };
    connect();
    const sub = AppState.addEventListener("change", (state) => {
      clearTimeout(timer);
      if (state === "active") {
        socket?.close();
        connect();
        void queryClient.invalidateQueries({
          queryKey: tripKey(session.tripId),
        });
      } else {
        socket?.close();
        useConnection.getState().set("offline");
      }
    });
    return () => {
      stopped = true;
      clearTimeout(timer);
      sub.remove();
      socket?.close();
    };
  }, [session?.tripId, token, base, epoch]);
  return null;
}

// Only an OS handoff receipt is retried. Votes and proposals always require a fresh user action.
interface HandoffReceipt {
  tripId: string;
  version: number;
  attempt: string;
  status: "opened" | "failed";
  requestId: string;
  revision: number;
}
let flushingHandoff = false;
export async function queueHandoff(
  trip: Trip,
  status: "opened" | "failed",
  attempt: string,
) {
  if (!trip.proposal) return;
  const receipt: HandoffReceipt = {
    tripId: trip.id,
    version: trip.proposal.version,
    attempt,
    status,
    requestId: requestId(),
    revision: trip.revision,
  };
  await AsyncStorage.setItem("convoy-handoff", JSON.stringify(receipt));
  await flushHandoff(trip);
}
async function flushHandoff(trip: Trip) {
  if (flushingHandoff) return;
  flushingHandoff = true;
  trip = queryClient.getQueryData<Trip>(tripKey(trip.id)) ?? trip;
  try {
    const raw = await AsyncStorage.getItem("convoy-handoff");
    if (!raw) return;
    const job = JSON.parse(raw) as HandoffReceipt;
    const session = useSession.getState().session;
    if (session?.tripId !== job.tripId || trip.id !== job.tripId) return;
    const member = trip.members.find((m) => m.id === session.memberId);
    if (
      trip.proposal?.version !== job.version ||
      trip.status !== "agreed" ||
      !member ||
      member.navigationAttempt !== job.attempt ||
      member.arrived ||
      member.navigation === job.status
    ) {
      await AsyncStorage.removeItem("convoy-handoff");
      return;
    }
    if (member.navigation !== "opening") return;
    const updated = await request<Trip>(`/trips/${job.tripId}/commands`, {
      requestId: job.requestId,
      revision: job.revision,
      command: {
        type: "navigation",
        version: job.version,
        status: job.status,
        attempt: job.attempt,
      },
    });
    acceptTrip(updated);
    await AsyncStorage.removeItem("convoy-handoff");
  } catch {
    /* Keep a version-scoped receipt until the next foreground snapshot. */
  } finally {
    flushingHandoff = false;
  }
}
