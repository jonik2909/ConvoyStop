import { useState } from "react";
import { Alert, Share, View } from "react-native";
import { useRouter } from "expo-router";
import { destinations } from "@convoy/domain";
import { seedStops } from "@convoy/domain/src/stops";
import {
  Badge,
  Button,
  CarHero,
  Divider,
  ErrorNotice,
  Icon,
  Label,
  Loading,
  Note,
  Page,
  Row,
  Section,
  SeedNote,
  StateReveal,
} from "../components/ui";
import { MemberRow } from "../components/member-row";
import {
  queueHandoff,
  useCommand,
  useConnection,
  useDemo,
  useTrip,
} from "../lib/api";
import { requestId, useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { IOSNavigationProvider } from "../providers/navigation";
export default function TripScreen() {
  const t = useT(),
    c = useTheme(),
    router = useRouter();
  const session = useSession((s) => s.session);
  const lang = useSession((s) => s.language);
  const tripQuery = useTrip();
  const trip = tripQuery.data;
  const cmd = useCommand(),
    demo = useDemo();
  const connection = useConnection((s) => s.status);
  const storageError = useSession((s) => s.storageError);
  const [localError, setLocalError] = useState<unknown>();
  const [opening, setOpening] = useState(false);
  if (!trip || !session)
    return (
      <Page>
        <Loading />
        <ErrorNotice error={tripQuery.error} />
        <Button
          title={t("retry")}
          onPress={() => {
            useConnection.getState().retry();
            void tripQuery.refetch();
          }}
        />
        <Button
          title={t("settings")}
          secondary
          onPress={() => router.push("/settings")}
        />
      </Page>
    );
  const me = trip.members.find((m) => m.id === session.memberId);
  const host = trip.hostId === session.memberId;
  const p = trip.proposal;
  const stop = seedStops.find((s) => s.id === p?.stopId);
  const online = connection === "connected" && !tripQuery.isError;
  const busy = cmd.isPending || opening;
  const expired = trip.expiresAt <= Date.now();
  const act = (command: Parameters<typeof cmd.mutate>[0]) => {
    setLocalError(null);
    cmd.mutate(command);
  };
  const openMaps = async () => {
    if (!stop || !p || opening) return;
    setOpening(true);
    setLocalError(null);
    const attempt = requestId();
    try {
      await cmd.mutateAsync({
        type: "navigation",
        version: p.version,
        status: "opening",
        attempt,
      });
      try {
        await new IOSNavigationProvider().open(stop);
      } catch (e) {
        setLocalError(e);
        await queueHandoff(trip, "failed", attempt);
        return;
      }
      await queueHandoff(trip, "opened", attempt);
    } catch (e) {
      setLocalError(e);
    } finally {
      setOpening(false);
    }
  };
  if (trip.status === "completed")
    return (
      <Page key="completed">
        <View style={{ gap: 24, paddingTop: 32 }}>
          <Badge title="JOURNEY / COMPLETE" />
          <Icon name="flag.checkered" size={48} />
          <Label kind="display">{t("finished")}</Label>
          <CarHero />
          <Label style={{ color: c.secondary }}>{t("completeNote")}</Label>
          <Label kind="heading">
            {stop ? (lang === "ko" ? stop.name : stop.en) : t("route")}
          </Label>
          <Label kind="small" style={{ color: c.secondary }}>
            {trip.members.length}
            {lang === "ko" ? "대 · 함께 도착" : " cars · arrived together"}
          </Label>
          <Button
            title={t("home")}
            onPress={() =>
              void useSession.getState().clearSession().catch(setLocalError)
            }
          />
        </View>
      </Page>
    );
  return (
    <Page key="active">
      <View style={{ gap: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Badge title={trip.demo ? t("demoLabel") : "CONVOY / TOGETHER"} />
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <View
              style={{
                height: 6,
                width: 6,
                borderRadius: 4,
                backgroundColor: online ? c.accent : c.secondary,
              }}
            />
            <Label kind="small" style={{ color: c.secondary }}>
              {online
                ? t("live")
                : connection === "connecting"
                  ? t("connecting")
                  : t("offline")}
            </Label>
          </View>
        </View>
        <Label kind="display">
          {trip.status === "agreed"
            ? t("agreed")
            : p?.status === "voting"
              ? t("voting")
              : p?.status === "rejected"
                ? t("rejected")
                : lang === "ko"
                  ? "같은 길,\n함께하는 여정."
                  : "One road,\na shared journey."}
        </Label>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Label style={{ color: c.secondary }}>
            {lang === "ko" ? "서울" : "Seoul"}
          </Label>
          <Icon name="arrow.right" size={14} color={c.secondary} />
          <Label style={{ fontWeight: "600" }}>
            {destinations[trip.destination][lang]}
          </Label>
        </View>
      </View>
      {!online && (
        <Section style={{ padding: 16, gap: 12 }}>
          <Note icon="wifi.slash">{t("stale")}</Note>
          <Button
            title={t("retry")}
            secondary
            busy={tripQuery.isFetching}
            onPress={() => {
              useConnection.getState().retry();
              void tripQuery.refetch();
            }}
          />
        </Section>
      )}
      {storageError && (
        <Note icon="exclamationmark.circle">
          {lang === "ko"
            ? "기기에 저장하지 못했어요. 앱을 닫기 전 저장 공간을 확인해 주세요."
            : "Could not save on this device. Check storage before closing the app."}
        </Note>
      )}
      {expired && <Note icon="clock">{t("expired")}</Note>}
      <CarHero compact />
      <ErrorNotice
        error={localError ?? cmd.error ?? demo.error ?? tripQuery.error}
      />
      {p && stop && (
        <StateReveal id={`${p.version}:${p.status}`}>
          <Section style={{ padding: 20, gap: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Badge title={`STOP / ${String(p.version).padStart(2, "0")}`} />
              <Icon
                name={
                  p.status === "agreed"
                    ? "checkmark.seal.fill"
                    : p.status === "rejected"
                      ? "arrow.triangle.2.circlepath"
                      : "mappin.and.ellipse"
                }
                color={c.text}
              />
            </View>
            <Label kind="title">{lang === "ko" ? stop.name : stop.en}</Label>
            <Label kind="small" style={{ color: c.secondary }}>
              {p.status === "agreed"
                ? t("agreed")
                : p.status === "rejected"
                  ? t("rejected")
                  : `${Object.values(p.votes).filter((v) => v === "approve").length} / ${trip.members.length} ${t("approve")}`}
            </Label>
            <SeedNote />
            {p.status === "voting" && !p.votes[session.memberId] && (
              <>
                <Button
                  title={t("approve")}
                  icon="checkmark"
                  testID="approve-stop"
                  disabled={!online || expired}
                  busy={busy}
                  onPress={() =>
                    act({
                      type: "vote",
                      version: p.version,
                      decision: "approve",
                    })
                  }
                />
                <Button
                  title={t("reject")}
                  secondary
                  disabled={!online || busy || expired}
                  onPress={() =>
                    Alert.alert(
                      t("reject"),
                      lang === "ko"
                        ? "이 제안을 마감하고 다른 경유지를 찾아요."
                        : "Close this proposal and find another stop.",
                      [
                        { text: t("cancel"), style: "cancel" },
                        {
                          text: t("reject"),
                          onPress: () =>
                            act({
                              type: "vote",
                              version: p.version,
                              decision: "reject",
                            }),
                        },
                      ],
                    )
                  }
                />
              </>
            )}
            {p.status === "voting" && p.votes[session.memberId] && (
              <Note icon="checkmark.circle">
                {t("voteDone")} · {t("waiting")}
              </Note>
            )}
            {p.status === "agreed" && me && !me.arrived && (
              <>
                <Button
                  title={t("maps")}
                  icon="arrow.up.right"
                  testID="open-maps"
                  busy={opening}
                  disabled={!online || cmd.isPending || expired}
                  onPress={() => void openMaps()}
                />
                <Note>{t("mapsNote")}</Note>
                {me.navigation === "opening" && (
                  <Note icon="exclamationmark.circle">{t("pendingMaps")}</Note>
                )}
                {me.navigation === "failed" && (
                  <Note icon="exclamationmark.circle">{t("failedMaps")}</Note>
                )}
                <Button
                  title={t("arrive")}
                  secondary
                  testID="confirm-arrival"
                  disabled={!online || busy || expired}
                  onPress={() =>
                    Alert.alert(
                      t("arrive"),
                      lang === "ko"
                        ? "실제로 도착하셨나요? 동행에게 도착 상태를 알려요."
                        : "Have you arrived? Your convoy will see this status.",
                      [
                        { text: t("cancel"), style: "cancel" },
                        {
                          text: t("arrive"),
                          onPress: () =>
                            act({ type: "arrive", version: p.version }),
                        },
                      ],
                    )
                  }
                />
              </>
            )}
            {p.status === "agreed" && me?.arrived && (
              <Note icon="flag.checkered">{t("arrived")}</Note>
            )}
          </Section>
        </StateReveal>
      )}
      <View style={{ gap: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Label kind="heading">{t("group")}</Label>
          <Label
            kind="small"
            style={{ fontVariant: ["tabular-nums"], color: c.secondary }}
          >
            {String(trip.members.length).padStart(2, "0")} / 06
          </Label>
        </View>
        <Section>
          {trip.members.map((member, index) => (
            <View key={member.id}>
              {index > 0 && <Divider />}
              <MemberRow
                member={member}
                index={index}
                mine={member.id === session.memberId}
                host={member.id === trip.hostId}
                proposal={p}
              />
            </View>
          ))}
        </Section>
        {trip.status !== "agreed" && (
          <Section>
            <Row
              title={t("needs")}
              icon="slider.horizontal.3"
              onPress={() => router.push("/needs")}
            />
            <Divider />
            <Row
              title={`${t("code")}  ${trip.code}`}
              icon="person.badge.plus"
              onPress={() =>
                void Share.share({
                  message: `ConvoyStop · ${t("route")}\n${t("code")}: ${trip.code}`,
                }).catch(setLocalError)
              }
            />
          </Section>
        )}
      </View>
      {trip.status !== "agreed" && (
        <>
          <Button
            title={host ? t("recommend") : t("stops")}
            icon="mappin.and.ellipse"
            disabled={!online || expired || trip.members.length < 2}
            onPress={() => router.push("/stops")}
          />
          {trip.members.length < 2 && <Note>{t("companionHint")}</Note>}
        </>
      )}
      {trip.status === "agreed" && (
        <>
          <Button
            title={t("finish")}
            testID="finish-trip"
            disabled={
              !host || !online || busy || !trip.members.every((m) => m.arrived)
            }
            onPress={() => act({ type: "finish" })}
          />
          {!trip.members.every((m) => m.arrived) && <Note>{t("waiting")}</Note>}
        </>
      )}
      {trip.demo &&
        p &&
        (p.status === "voting" ||
          (p.status === "agreed" &&
            !trip.members.find((m) => m.id.startsWith("demo-"))?.arrived)) && (
          <Section style={{ padding: 16, gap: 12 }}>
            <Badge title="DEMO / CONTROLS" />
            <Label kind="small" style={{ color: c.secondary }}>
              {t("demoHint")}
            </Label>
            {p?.status === "voting" && (
              <>
                <Button
                  title={t("demoApprove")}
                  secondary
                  disabled={!online}
                  busy={demo.isPending}
                  testID="demo-approve"
                  onPress={() => demo.mutate("approve")}
                />
                <Button
                  title={t("demoReject")}
                  quiet
                  disabled={!online || demo.isPending}
                  onPress={() => demo.mutate("reject")}
                />
              </>
            )}
            {p?.status === "agreed" &&
              !trip.members.find((m) => m.id.startsWith("demo-"))?.arrived && (
                <Button
                  title={t("demoArrive")}
                  secondary
                  disabled={!online}
                  busy={demo.isPending}
                  testID="demo-arrive"
                  onPress={() => demo.mutate("arrive")}
                />
              )}
          </Section>
        )}
      <Note>{t("dataNote")}</Note>
    </Page>
  );
}
