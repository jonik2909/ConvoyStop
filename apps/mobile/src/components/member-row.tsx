import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeInRight,
  useReducedMotion,
} from "react-native-reanimated";
import type { Member, Proposal } from "@convoy/domain";
import { activeNeeds } from "@convoy/domain";
import { Icon, Label } from "./ui";
import { useSession } from "../lib/session";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
export function MemberRow({
  member,
  index,
  mine,
  host,
  proposal,
}: {
  member: Member;
  index: number;
  mine: boolean;
  host: boolean;
  proposal: Proposal | null;
}) {
  const c = useTheme(),
    t = useT();
  const lang = useSession((s) => s.language);
  const reduced = useReducedMotion();
  const vote = proposal?.votes[member.id];
  const status = member.arrived
    ? t("arrived")
    : member.navigation === "opened"
      ? t("mapOpened")
      : member.navigation === "opening"
        ? t("pendingMaps")
        : member.navigation === "failed"
          ? t("failedMaps")
          : vote === "approve"
            ? t("approve")
            : vote === "reject"
              ? t("reject")
              : null;
  return (
    <Animated.View
      entering={reduced ? FadeIn.duration(120) : FadeInRight.duration(220)}
      style={{ padding: 16, gap: 12 }}
    >
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Icon name={member.vehicle === "ev" ? "bolt.car" : "car"} size={28} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Label style={{ fontWeight: "600" }}>
            {member.name}
            {mine ? (lang === "ko" ? " · 나" : " · me") : ""}
            {host ? (lang === "ko" ? " · 방장" : " · host") : ""}
          </Label>
          <Label kind="small" style={{ color: c.secondary }}>
            {t(member.vehicle)} ·{" "}
            {member.level === null ? t("noEnergy") : `${member.level}%`} ·{" "}
            {t(
              member.source === "demo"
                ? "demoLabel"
                : member.source === "unavailable"
                  ? "unavailable"
                  : "manual",
            )}
          </Label>
        </View>
        <Label
          kind="micro"
          style={{ fontVariant: ["tabular-nums"], color: c.secondary }}
        >
          {String(index + 1).padStart(2, "0")}
        </Label>
      </View>
      {Date.now() - member.telemetryAt > 30 * 60 * 1000 && (
        <Label kind="small" style={{ color: c.secondary, paddingLeft: 52 }}>
          {useSession.getState().language === "ko"
            ? "오래된 입력 · 다시 확인해 주세요"
            : "Old input · please verify"}
        </Label>
      )}
      {(activeNeeds(member).length > 0 || status) && (
        <View style={{ paddingLeft: 52, gap: 8 }}>
          {activeNeeds(member).length > 0 && (
            <Label kind="small" style={{ color: c.secondary }}>
              {activeNeeds(member)
                .map((n) => t(n))
                .join(" · ")}
            </Label>
          )}
          {status && (
            <View
              style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
            >
              <Icon
                name={
                  vote === "reject"
                    ? "arrow.triangle.2.circlepath"
                    : member.arrived
                      ? "flag.checkered"
                      : vote === "approve"
                        ? "checkmark.circle.fill"
                        : "location"
                }
                size={14}
                color={c.text}
              />
              <Label kind="small">{status}</Label>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}
