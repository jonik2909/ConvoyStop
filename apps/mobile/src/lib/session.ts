import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, Trip } from "@convoy/domain";
export const DEFAULT_API =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8787";
interface State {
  ready: boolean;
  storageError: boolean;
  onboarded: boolean;
  token: string;
  session: Session | null;
  cached: Trip | null;
  theme: "system" | "dark" | "light";
  language: "ko" | "en";
  apiUrl: string;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setSession: (s: Session, t: Trip) => Promise<void>;
  clearSession: () => Promise<void>;
  cache: (t: Trip) => void;
  preferences: (
    p: Partial<Pick<State, "theme" | "language" | "apiUrl">>,
  ) => Promise<void>;
}
export const useSession = create<State>((set, get) => ({
  ready: false,
  storageError: false,
  onboarded: false,
  token: "",
  session: null,
  cached: null,
  theme: "system",
  language: "ko",
  apiUrl: DEFAULT_API,
  hydrate: async () => {
    try {
      let token = await SecureStore.getItemAsync("convoy-device");
      if (!token) {
        token = Array.from(Crypto.getRandomBytes(32), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
        await SecureStore.setItemAsync("convoy-device", token);
      }
      const [local, cache] = await Promise.all([
        AsyncStorage.getItem("convoy-local"),
        AsyncStorage.getItem("convoy-cache"),
      ]);
      const saved = local ? JSON.parse(local) : {};
      set({
        ...saved,
        session: saved.session ? { ...saved.session, token } : null,
        token,
        cached: cache ? JSON.parse(cache) : null,
        ready: true,
      });
    } catch {
      set({ storageError: true, ready: true });
    }
  },
  completeOnboarding: async () => {
    await save({ ...get(), onboarded: true });
    set({ onboarded: true });
  },
  setSession: async (session, cached) => {
    await Promise.all([
      save({ ...get(), session }),
      AsyncStorage.setItem("convoy-cache", JSON.stringify(cached)),
    ]);
    set({ session, cached });
  },
  clearSession: async () => {
    await Promise.all([
      save({ ...get(), session: null }),
      AsyncStorage.removeItem("convoy-cache"),
      AsyncStorage.removeItem("convoy-handoff"),
    ]);
    set({ session: null, cached: null });
  },
  cache: (cached) => {
    if (get().session?.tripId !== cached.id) return;
    set({ cached });
    void AsyncStorage.setItem("convoy-cache", JSON.stringify(cached)).catch(
      () => set({ storageError: true }),
    );
  },
  preferences: async (p) => {
    set(p);
    await save(get());
  },
}));
async function save(s: State) {
  await AsyncStorage.setItem(
    "convoy-local",
    JSON.stringify({
      onboarded: s.onboarded,
      session: s.session
        ? { tripId: s.session.tripId, memberId: s.session.memberId }
        : null,
      theme: s.theme,
      language: s.language,
      apiUrl: s.apiUrl,
    }),
  );
}
export const requestId = () => Crypto.randomUUID();
