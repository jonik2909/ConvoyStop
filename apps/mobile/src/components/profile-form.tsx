import { useRef, useState, type ComponentRef } from "react";
import { TextInput, View, Pressable } from "react-native";
import { Stack, useRouter, usePreventRemove } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { destinations, type Destination, type Trip } from "@convoy/domain";
import {
  Badge,
  Button,
  CarHero,
  ErrorNotice,
  Icon,
  Label,
  Note,
  Page,
  Row,
  Section,
} from "./ui";
import { useTheme } from "../lib/theme";
import { useT } from "../lib/i18n";
import { request } from "../lib/api";
import { requestId, useSession } from "../lib/session";
import {
  DemoVehicleProvider,
  ManualVehicleProvider,
} from "../providers/vehicle";
export function ProfileForm({
  mode,
  demo = false,
}: {
  mode: "create" | "join";
  demo?: boolean;
}) {
  const c = useTheme(),
    t = useT(),
    router = useRouter();
  const lang = useSession((s) => s.language);
  const name = useRef(demo ? "민준의 차" : "");
  const code = useRef("");
  const nameInput = useRef<ComponentRef<typeof TextInput>>(null);
  const [vehicle, setVehicle] = useState<"ev" | "ice">("ev");
  const [destination, setDestination] = useState<Destination>("gangneung");
  const latest = useRef({ signature: "", id: requestId() });
  const submit = useMutation({
    mutationFn: async () => {
      const cleanName = name.current.trim();
      if (
        !cleanName ||
        cleanName.length > 20 ||
        (mode === "join" &&
          !/^[A-HJ-NP-Z2-9]{6}$/.test(code.current.trim().toUpperCase()))
      )
        throw new Error("VALIDATION");
      const telemetry = await (
        demo ? new DemoVehicleProvider() : new ManualVehicleProvider(null)
      ).read();
      const body = {
        profile: {
          name: cleanName,
          vehicle,
          level: telemetry.level,
          source: telemetry.source,
        },
        ...(mode === "create"
          ? { destination, demo }
          : { code: code.current.trim().toUpperCase() }),
      };
      const signature = JSON.stringify(body);
      if (latest.current.signature !== signature)
        latest.current = { signature, id: requestId() };
      return request<{ trip: Trip; memberId: string }>(
        mode === "create" ? "/trips" : "/join",
        { ...body, requestId: latest.current.id },
      );
    },
    onSuccess: async (result) => {
      disablePrevention();
      const state = useSession.getState();
      await state.setSession(
        {
          tripId: result.trip.id,
          memberId: result.memberId,
          token: state.token,
        },
        result.trip,
      );
    },
  });
  const disablePrevention = usePreventRemove(submit.isPending);
  return (
    <Page>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("cancel")}
              disabled={submit.isPending}
              accessibilityState={{ disabled: submit.isPending }}
              style={{ minHeight: 44, justifyContent: "center" }}
              onPress={() => router.back()}
            >
              <Label>{t("cancel")}</Label>
            </Pressable>
          ),
        }}
      />
      <View style={{ gap: 8 }}>
        <Badge title={demo ? t("demoLabel") : "CONVOY / COMPANION"} />
        <Label kind="title">
          {mode === "create" ? t("create") : t("join")}
        </Label>
        <Label style={{ color: c.secondary }}>
          {mode === "create" ? t("routeNote") : t("code")}
        </Label>
      </View>
      {mode === "join" && (
        <View style={{ gap: 8 }}>
          <Label kind="small">{t("code")}</Label>
          <TextInput
            accessibilityLabel={t("code")}
            testID="invite-code"
            placeholder="ABC234"
            placeholderTextColor={c.subtle}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardType="ascii-capable"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => nameInput.current?.focus()}
            editable={!submit.isPending}
            onChangeText={(v) => {
              code.current = v;
              submit.reset();
            }}
            style={{
              backgroundColor: c.surface,
              color: c.text,
              padding: 16,
              minHeight: 64,
              borderRadius: 8,
              borderCurve: "continuous",
              fontSize: 28,
              fontWeight: "600",
              letterSpacing: 8,
            }}
          />
        </View>
      )}
      <View style={{ gap: 8 }}>
        <Label kind="small">{t("name")}</Label>
        <TextInput
          ref={nameInput}
          accessibilityLabel={t("name")}
          testID="car-name"
          defaultValue={name.current}
          placeholder={lang === "ko" ? "나의 차" : "My car"}
          placeholderTextColor={c.subtle}
          maxLength={20}
          autoCorrect={false}
          returnKeyType="done"
          editable={!submit.isPending}
          onChangeText={(v) => {
            name.current = v;
            submit.reset();
          }}
          style={{
            backgroundColor: c.surface,
            color: c.text,
            padding: 16,
            minHeight: 56,
            borderRadius: 8,
            borderCurve: "continuous",
            fontSize: 17,
          }}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Label kind="small">{t("vehicle")}</Label>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {(["ev", "ice"] as const).map((v) => (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ selected: v === vehicle }}
              accessibilityLabel={t(v)}
              onPress={() => setVehicle(v)}
              style={{
                flex: 1,
                minHeight: 64,
                padding: 16,
                borderRadius: 16,
                borderCurve: "continuous",
                backgroundColor: v === vehicle ? c.accent : c.surface,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Icon
                name={v === "ev" ? "bolt.car" : "car"}
                color={v === vehicle ? c.onAccent : c.text}
              />
              <Label style={{ color: v === vehicle ? c.onAccent : c.text }}>
                {t(v)}
              </Label>
            </Pressable>
          ))}
        </View>
      </View>
      {mode === "create" && (
        <View style={{ gap: 8 }}>
          <Label kind="small">{t("destination")}</Label>
          <Section>
            {(Object.keys(destinations) as Destination[]).map((d) => (
              <Row
                key={d}
                title={destinations[d][useSession.getState().language]}
                onPress={() => setDestination(d)}
                trailing={
                  <Icon
                    name={
                      d === destination ? "checkmark.circle.fill" : "circle"
                    }
                    color={d === destination ? c.text : c.subtle}
                  />
                }
              />
            ))}
          </Section>
        </View>
      )}
      {demo && (
        <>
          <CarHero compact />
          <Note>{t("demoHint")}</Note>
        </>
      )}
      <ErrorNotice error={submit.error} />
      <Button
        title={mode === "create" ? t("createAction") : t("joinAction")}
        testID="submit-trip"
        busy={submit.isPending}
        onPress={() => submit.mutate()}
      />
      <Note>{t("dataNote")}</Note>
    </Page>
  );
}
