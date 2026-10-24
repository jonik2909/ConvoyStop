import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { rankStops } from "@convoy/domain";
import {
  Badge,
  Button,
  ErrorNotice,
  Icon,
  Label,
  Loading,
  Note,
  Section,
  SeedNote,
} from "../components/ui";
import { useCommand, useConnection, useStops, useTrip } from "../lib/api";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
export default function Stops() {
  const t = useT(),
    c = useTheme(),
    router = useRouter(),
    insets = useSafeAreaInsets();
  const lang = useSession((s) => s.language),
    session = useSession((s) => s.session);
  const trip = useTrip().data;
  const query = useStops(),
    cmd = useCommand();
  const online = useConnection((s) => s.status) === "connected";
  if (!trip) return <Loading />;
  if (trip.status === "completed" || trip.status === "agreed")
    return <Redirect href="/" />;
  const ranked = rankStops(trip.members, query.data?.stops ?? []);
  const host = trip.hostId === session?.memberId;
  return (
    <FlashList
      data={ranked}
      keyExtractor={(item) => item.stop.id}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 32 }}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      ListHeaderComponent={
        <View style={{ gap: 16, paddingBottom: 24 }}>
          <Badge title="GROUP / RECOMMENDATION" />
          <Label kind="display">
            {lang === "ko"
              ? "모두에게 맞는\n한 번의 쉼."
              : "One stop.\nEvery car considered."}
          </Label>
          <Label style={{ color: c.secondary }}>
            {trip.members.length}
            {lang === "ko"
              ? "대의 필요를 함께 비교했어요."
              : " cars, considered together."}
          </Label>
          <SeedNote />
          <ErrorNotice error={query.error ?? cmd.error} />
          {query.isError && (
            <Button title={t("retry")} onPress={() => void query.refetch()} />
          )}
        </View>
      }
      ListEmptyComponent={
        query.isLoading ? (
          <Loading />
        ) : (
          <View style={{ gap: 16, paddingVertical: 24 }}>
            <Icon name="line.3.horizontal.decrease.circle" size={40} />
            <Label kind="heading">{t("noMatch")}</Label>
            <Note>{t("noMatchHint")}</Note>
            <Button title={t("needs")} onPress={() => router.push("/needs")} />
          </View>
        )
      }
      renderItem={({ item, index }) => (
        <Section style={{ padding: 20, gap: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Label
              kind="micro"
              style={{ color: c.secondary, fontVariant: ["tabular-nums"] }}
            >
              {index === 0
                ? "RECOMMENDED"
                : `ALTERNATIVE / ${String(index).padStart(2, "0")}`}
            </Label>
            <Icon
              name={
                index === 0 ? "mappin.and.ellipse" : "arrow.triangle.branch"
              }
            />
          </View>
          <Label kind="title">
            {lang === "ko" ? item.stop.name : item.stop.en}
          </Label>
          <Label kind="small" style={{ color: c.secondary }}>
            {item.stop.region}
          </Label>
          <View
            style={{
              flexDirection: "row",
              gap: 24,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: c.line,
            }}
          >
            <View style={{ gap: 4, flex: 1 }}>
              <Label kind="title" style={{ fontVariant: ["tabular-nums"] }}>
                {item.covered.length}
                <Label style={{ color: c.secondary }}>
                  {" "}
                  / {item.totalNeeds}
                </Label>
              </Label>
              <Label kind="small" style={{ color: c.secondary }}>
                {lang === "ko" ? "필요 충족" : "needs covered"}
              </Label>
            </View>
            <View style={{ gap: 4, flex: 1 }}>
              <Label kind="title" style={{ fontVariant: ["tabular-nums"] }}>
                +{item.stop.detourMinutes}
                <Label> {lang === "ko" ? "분" : "min"}</Label>
              </Label>
              <Label kind="small" style={{ color: c.secondary }}>
                {lang === "ko" ? "예시 추가 이동" : "illustrative extra travel"}
              </Label>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {item.covered.map((n) => (
              <View
                key={n}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  backgroundColor: c.elevated,
                }}
              >
                <Label kind="small">{t(n)}</Label>
              </View>
            ))}
          </View>
          <Note icon="checkmark.circle">
            {lang === "ko"
              ? "모든 차량의 필수 조건을 충족해요."
              : "Meets every car’s required conditions."}
          </Note>
          {host && (
            <Button
              title={t("suggest")}
              secondary={index > 0}
              testID={`propose-${item.stop.id}`}
              busy={cmd.isPending}
              disabled={!online}
              onPress={() =>
                cmd.mutate(
                  { type: "propose", stopId: item.stop.id },
                  { onSuccess: () => router.dismissTo("/") },
                )
              }
            />
          )}
        </Section>
      )}
      ListFooterComponent={
        <View style={{ paddingTop: 24 }}>
          <Note>{t("seedDetail")}</Note>
        </View>
      }
    />
  );
}
