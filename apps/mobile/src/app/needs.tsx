import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Switch, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Stack, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router";
import type { Need, NeedsInput } from "@convoy/domain";
import {
  Badge,
  Button,
  Divider,
  ErrorNotice,
  Icon,
  Label,
  Loading,
  Note,
  Page,
  Row,
  Section,
} from "../components/ui";
import { useCommand, useConnection, useTrip } from "../lib/api";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
export default function Needs() {
  const trip = useTrip().data,
    memberId = useSession((s) => s.session?.memberId);
  const me = trip?.members.find((m) => m.id === memberId);
  return me ? (
    <NeedsEditor
      initial={{
        needs: me.needs,
        required: me.required,
        level: me.level,
        connector: me.connector,
        maxDetour: me.maxDetour,
        accessible: me.accessible,
        threshold: me.threshold,
      }}
      vehicle={me.vehicle}
      source={me.source}
    />
  ) : (
    <Loading />
  );
}
function NeedsEditor({
  initial,
  vehicle,
  source,
}: {
  initial: NeedsInput;
  vehicle: "ev" | "ice";
  source: string;
}) {
  const t = useT(),
    c = useTheme(),
    router = useRouter(),
    cmd = useCommand();
  const lang = useSession((s) => s.language);
  const online = useConnection((s) => s.status) === "connected";
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [discarded, setDiscarded] = useState(false);
  const baseline = useRef(JSON.stringify(initial));
  const dirty = JSON.stringify(draft) !== baseline.current;
  usePreventRemove(
    (dirty || cmd.isPending) && !saved && !discarded,
    ({ repeat }) => {
      if (cmd.isPending) return;
      Alert.alert(t("unsaved"), undefined, [
        { text: t("stay"), style: "cancel" },
        {
          text: t("discard"),
          style: "destructive",
          onPress: () => {
            setDiscarded(true);
            repeat();
          },
        },
      ]);
    },
  );
  useEffect(() => {
    if (saved) router.back();
  }, [saved, router]);
  const toggle = (n: Need) =>
    setDraft((d) => ({
      ...d,
      needs: d.needs.includes(n)
        ? d.needs.filter((x) => x !== n)
        : [...d.needs, n],
      required: d.required.filter((x) => x !== n),
    }));
  const automatic =
    draft.level !== null && draft.level <= draft.threshold
      ? vehicle === "ev"
        ? "charge"
        : "fuel"
      : null;
  const needs: Need[] = [
    vehicle === "ev" ? "charge" : "fuel",
    "food",
    "rest",
    "toilet",
  ];
  return (
    <Page>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("cancel")}
              disabled={cmd.isPending}
              onPress={() => router.back()}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Label>{t("cancel")}</Label>
            </Pressable>
          ),
        }}
      />
      <View style={{ gap: 12 }}>
        <Badge title={source === "demo" ? t("demoLabel") : t("manual")} />
        <Label kind="title">{t("needs")}</Label>
        <Label style={{ color: c.secondary }}>{t("needsHint")}</Label>
      </View>
      <Section>
        {needs.map((n, index) => (
          <View key={n}>
            {index > 0 && <Divider />}
            <Row
              title={t(n)}
              icon={
                n === "charge"
                  ? "bolt"
                  : n === "fuel"
                    ? "fuelpump"
                    : n === "food"
                      ? "fork.knife"
                      : n === "rest"
                        ? "cup.and.saucer"
                        : "figure.stand"
              }
              detail={
                automatic === n
                  ? lang === "ko"
                    ? "잔량 설정에 따라 필수"
                    : "Required by energy threshold"
                  : undefined
              }
              onPress={automatic === n ? undefined : () => toggle(n)}
              trailing={
                <Icon
                  name={
                    draft.needs.includes(n) || automatic === n
                      ? "checkmark.circle.fill"
                      : "circle"
                  }
                  color={
                    draft.needs.includes(n) || automatic === n
                      ? c.text
                      : c.subtle
                  }
                />
              }
            />
            {draft.needs.includes(n) && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: 56,
                  paddingRight: 16,
                  paddingBottom: 16,
                  gap: 12,
                }}
              >
                <Label kind="small" style={{ color: c.secondary }}>
                  {t("required")}
                </Label>
                <Switch
                  accessibilityLabel={`${t(n)} ${t("required")}`}
                  value={draft.required.includes(n)}
                  trackColor={{ true: c.accent }}
                  onValueChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      required: v
                        ? [...d.required, n]
                        : d.required.filter((x) => x !== n),
                    }))
                  }
                />
              </View>
            )}
          </View>
        ))}
      </Section>
      <Section style={{ padding: 20, gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Label kind="heading">{t("energy")}</Label>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Label kind="small">{t("noEnergy")}</Label>
            <Switch
              accessibilityLabel={t("noEnergy")}
              value={draft.level === null}
              trackColor={{ true: c.accent }}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, level: v ? null : 50 }))
              }
            />
          </View>
        </View>
        <Label kind="display" style={{ fontVariant: ["tabular-nums"] }}>
          {draft.level === null ? "—" : `${draft.level}%`}
        </Label>
        {draft.level !== null && (
          <Slider
            accessibilityLabel={t("energy")}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={draft.level}
            minimumTrackTintColor={c.text}
            maximumTrackTintColor={c.line}
            thumbTintColor={c.text}
            onValueChange={(v) => setDraft((d) => ({ ...d, level: v }))}
          />
        )}
        <Label kind="small" style={{ color: c.secondary }}>
          {draft.threshold}% {t("threshold")}
        </Label>
        <Slider
          accessibilityLabel={t("threshold")}
          minimumValue={5}
          maximumValue={60}
          step={5}
          value={draft.threshold}
          minimumTrackTintColor={c.text}
          maximumTrackTintColor={c.line}
          thumbTintColor={c.text}
          onValueChange={(v) => setDraft((d) => ({ ...d, threshold: v }))}
        />
        <Note>{t("dataNote")}</Note>
      </Section>
      {vehicle === "ev" && (
        <Section>
          <Row
            title="CCS1 / DC 콤보"
            onPress={() => setDraft((d) => ({ ...d, connector: "ccs1" }))}
            trailing={
              <Icon
                name={
                  draft.connector === "ccs1"
                    ? "checkmark.circle.fill"
                    : "circle"
                }
              />
            }
          />
          <Divider />
          <Row
            title="CHAdeMO"
            onPress={() => setDraft((d) => ({ ...d, connector: "chademo" }))}
            trailing={
              <Icon
                name={
                  draft.connector === "chademo"
                    ? "checkmark.circle.fill"
                    : "circle"
                }
              />
            }
          />
        </Section>
      )}
      <Section style={{ padding: 20, gap: 16 }}>
        <Label kind="heading">{t("detour")}</Label>
        <Label kind="title" style={{ fontVariant: ["tabular-nums"] }}>
          +{draft.maxDetour} {lang === "ko" ? "분" : "min"}
        </Label>
        <Slider
          accessibilityLabel={t("detour")}
          minimumValue={0}
          maximumValue={20}
          step={1}
          value={draft.maxDetour}
          minimumTrackTintColor={c.text}
          maximumTrackTintColor={c.line}
          thumbTintColor={c.text}
          onValueChange={(v) => setDraft((d) => ({ ...d, maxDetour: v }))}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Label style={{ flex: 1 }}>{t("accessible")}</Label>
          <Switch
            accessibilityLabel={t("accessible")}
            value={draft.accessible}
            trackColor={{ true: c.accent }}
            onValueChange={(v) => setDraft((d) => ({ ...d, accessible: v }))}
          />
        </View>
      </Section>
      <ErrorNotice error={cmd.error} />
      <Button
        title={t("save")}
        testID="save-needs"
        disabled={!online}
        busy={cmd.isPending}
        onPress={() => {
          if (!dirty) setSaved(true);
          else
            cmd.mutate(
              { type: "needs", input: draft },
              { onSuccess: () => setSaved(true) },
            );
        }}
      />
      <Note>{t("seed")}</Note>
    </Page>
  );
}
