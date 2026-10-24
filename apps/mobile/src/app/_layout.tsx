import { useEffect, useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, DarkTheme, DefaultTheme } from "expo-router";
import { queryClient, SyncBridge } from "../lib/api";
import { useSession } from "../lib/session";
import { useTheme } from "../lib/theme";
import { useT } from "../lib/i18n";
import { Button, Label, Icon } from "../components/ui";
import { preloadCar } from "../lib/assets";
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: false });
export const unstable_settings = { initialRouteName: "index" };
export default function Layout() {
  const [assetsReady, setAssetsReady] = useState(false);
  const ready = useSession((s) => s.ready);
  const storageError = useSession((s) => s.storageError);
  const c = useTheme();
  const t = useT();
  const onboarded = useSession((s) => s.onboarded);
  const session = useSession((s) => s.session);
  const completed = useSession((s) => s.cached?.status === "completed");
  const router = useRouter();
  useEffect(() => {
    void Promise.allSettled([
      useSession.getState().hydrate(),
      preloadCar(),
    ]).then(() => setAssetsReady(true));
  }, []);
  if (!ready || !assetsReady) return null;
  if (storageError && !useSession.getState().token)
    return (
      <View
        onLayout={() => void SplashScreen.hideAsync()}
        style={{
          flex: 1,
          padding: 24,
          justifyContent: "center",
          gap: 24,
          backgroundColor: c.bg,
        }}
      >
        <Label>기기 저장소를 열지 못했어요.</Label>
        <Button
          title={t("retry")}
          onPress={() => void useSession.getState().hydrate()}
        />
      </View>
    );
  const theme = {
    ...(c.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(c.dark ? DarkTheme : DefaultTheme).colors,
      primary: c.text,
      background: c.bg,
      card: c.bg,
      text: c.text,
      border: c.line,
    },
  };
  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={theme}>
          <SyncBridge />
          <StatusBar style={c.dark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerBackButtonDisplayMode: "minimal",
              headerTintColor: c.text,
              contentStyle: { backgroundColor: c.bg },
              headerStyle: { backgroundColor: c.bg },
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                title: session && !completed ? t("journey") : "ConvoyStop",
                headerRight: () =>
                  onboarded ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("settings")}
                      style={{ padding: 12, minWidth: 44, minHeight: 44 }}
                      onPress={() => router.push("/settings")}
                    >
                      <Icon name="slider.horizontal.3" />
                    </Pressable>
                  ) : null,
                headerShown: onboarded,
                headerBackVisible: false,
                animation: "none",
              }}
            />
            <Stack.Protected guard={onboarded && !session}>
              <Stack.Screen
                name="create"
                options={{ title: t("create"), presentation: "modal" }}
              />
              <Stack.Screen
                name="join"
                options={{ title: t("join"), presentation: "modal" }}
              />
            </Stack.Protected>
            <Stack.Protected guard={onboarded && !!session}>
              <Stack.Screen
                name="needs"
                options={{
                  title: t("needs"),
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.92],
                  sheetGrabberVisible: true,
                }}
              />
              <Stack.Screen name="stops" options={{ title: t("stops") }} />
            </Stack.Protected>
            <Stack.Screen
              name="settings"
              options={{ title: t("settings"), presentation: "modal" }}
            />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
