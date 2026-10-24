import { useRef, useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  Badge,
  Button,
  Divider,
  ErrorNotice,
  Icon,
  Label,
  Note,
  Page,
  Row,
  Section,
} from "../components/ui";
import { useSession } from "../lib/session";
import { queryClient, useCommand, useConnection } from "../lib/api";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
export default function Settings() {
  const t = useT(),
    c = useTheme(),
    router = useRouter();
  const state = useSession();
  const cmd = useCommand();
  const online = useConnection((s) => s.status) === "connected";
  const address = useRef(state.apiUrl);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const change = async (p: Parameters<typeof state.preferences>[0]) => {
    try {
      setError(null);
      await state.preferences(p);
    } catch (e) {
      setError(e);
    }
  };
  const forget = () =>
    Alert.alert(
      state.language === "ko"
        ? "이 기기에서 여정 닫기"
        : "Close trip on this device",
      state.language === "ko"
        ? "서버의 그룹은 유지돼요. 같은 코드로 다시 참여할 수 있어요."
        : "The server group remains. Rejoin with the same code.",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("close"),
          style: "destructive",
          onPress: () =>
            void state
              .clearSession()
              .then(() => {
                queryClient.clear();
                router.dismissAll();
              })
              .catch(setError),
        },
      ],
    );
  return (
    <Page>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("close")}
              style={{ minHeight: 44, justifyContent: "center" }}
              onPress={() => router.back()}
            >
              <Label>{t("close")}</Label>
            </Pressable>
          ),
        }}
      />
      <Badge title="CONVOYSTOP / PREFERENCES" />
      <View style={{ gap: 8 }}>
        <Label kind="small" style={{ color: c.secondary }}>
          {t("appearance")}
        </Label>
        <Section>
          {(["system", "light", "dark"] as const).map((mode) => (
            <Row
              key={mode}
              title={t(mode)}
              onPress={() => void change({ theme: mode })}
              trailing={
                <Icon
                  name={
                    state.theme === mode ? "checkmark.circle.fill" : "circle"
                  }
                />
              }
            />
          ))}
        </Section>
      </View>
      <View style={{ gap: 8 }}>
        <Label kind="small" style={{ color: c.secondary }}>
          {t("language")}
        </Label>
        <Section>
          {(["ko", "en"] as const).map((l) => (
            <Row
              key={l}
              title={l === "ko" ? "한국어" : "English"}
              onPress={() => void change({ language: l })}
              trailing={
                <Icon
                  name={
                    state.language === l ? "checkmark.circle.fill" : "circle"
                  }
                />
              }
            />
          ))}
        </Section>
      </View>
      <View style={{ gap: 12 }}>
        <Label kind="heading">{t("connection")}</Label>
        <TextInput
          accessibilityLabel={t("serverAddress")}
          defaultValue={state.apiUrl}
          editable={!state.session}
          onChangeText={(s) => (address.current = s)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          style={{
            backgroundColor: c.surface,
            color: c.text,
            padding: 16,
            fontSize: 15,
            minHeight: 56,
            borderRadius: 8,
            borderCurve: "continuous",
            opacity: state.session ? 0.5 : 1,
          }}
        />
        <Note>
          {state.session
            ? state.language === "ko"
              ? "여정을 닫은 후 서버 주소를 바꿀 수 있어요."
              : "Close the current trip before changing servers."
            : t("serverHint")}
        </Note>
        {!state.session && (
          <Button
            title={t("apply")}
            secondary
            busy={busy}
            onPress={() => {
              try {
                const url = new URL(address.current.trim());
                if (
                  !["http:", "https:"].includes(url.protocol) ||
                  url.username ||
                  url.password ||
                  url.pathname !== "/" ||
                  url.search ||
                  url.hash
                )
                  throw new Error("VALIDATION");
                setBusy(true);
                void change({ apiUrl: url.origin }).finally(() => {
                  queryClient.clear();
                  setBusy(false);
                });
              } catch (e) {
                setError(e);
              }
            }}
          />
        )}
      </View>
      {state.session && (
        <Section>
          {state.cached?.status !== "completed" && (
            <Row
              title={t("leave")}
              icon="rectangle.portrait.and.arrow.right"
              onPress={() =>
                Alert.alert(
                  t("leave"),
                  state.language === "ko"
                    ? "진행 중인 제안은 초기화돼요. 방장이 나가면 다음 차량이 이어받아요."
                    : "The proposal resets. The next car becomes host if needed.",
                  [
                    { text: t("cancel"), style: "cancel" },
                    {
                      text: t("leave"),
                      style: "destructive",
                      onPress: () => {
                        if (!online) {
                          setError(new Error("NETWORK"));
                          return;
                        }
                        cmd.mutate(
                          { type: "leave" },
                          {
                            onSuccess: () =>
                              void state
                                .clearSession()
                                .then(() => {
                                  queryClient.clear();
                                  router.dismissAll();
                                })
                                .catch(setError),
                          },
                        );
                      },
                    },
                  ],
                )
              }
            />
          )}
          <Divider />
          <Row
            title={
              state.language === "ko"
                ? "이 기기에서 여정 닫기"
                : "Close trip on this device"
            }
            onPress={forget}
          />
        </Section>
      )}
      <ErrorNotice error={error ?? cmd.error} />
      <View style={{ gap: 12 }}>
        <Label kind="heading">{t("about")}</Label>
        <Note>{t("aboutText")}</Note>
        <Note>{t("seedDetail")}</Note>
        <Label kind="micro" style={{ color: c.secondary }}>
          VERSION 1.0 / IOS COMPANION
        </Label>
      </View>
    </Page>
  );
}
