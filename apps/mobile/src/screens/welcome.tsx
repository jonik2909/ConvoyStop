import { useState } from "react";
import { View, useWindowDimensions } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Badge,
  Button,
  CarHero,
  ErrorNotice,
  Label,
  Note,
  Page,
} from "../components/ui";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { useSession } from "../lib/session";
export default function Welcome() {
  const lang = useSession((s) => s.language);
  const t = useT(),
    c = useTheme(),
    insets = useSafeAreaInsets();
  const compact = useWindowDimensions().height < 750;
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  return (
    <Page
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + (compact ? 16 : 32),
        justifyContent: "space-between",
      }}
    >
      <View style={{ gap: compact ? 24 : 32 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Label kind="heading">ConvoyStop</Label>
          <Badge title="DRIVE / TOGETHER" />
        </View>
        <View style={{ gap: 16, paddingTop: compact ? 16 : 32 }}>
          <Label kind="display">{t("together")}</Label>
          <Label style={{ color: c.secondary }}>{t("welcomeDetail")}</Label>
        </View>
        <CarHero />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ height: 2, flex: 1, backgroundColor: c.line }} />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: c.accent,
            }}
          />
          <Label kind="micro" style={{ color: c.secondary }}>
            ONE CONVOY. ONE STOP.
          </Label>
          <View style={{ height: 2, flex: 1, backgroundColor: c.line }} />
        </View>
      </View>
      <View style={{ gap: 16, paddingTop: compact ? 16 : 32 }}>
        <ErrorNotice error={error} />
        <Button
          title={t("start")}
          busy={busy}
          testID="get-started"
          onPress={() => {
            setBusy(true);
            void useSession
              .getState()
              .completeOnboarding()
              .catch((e) => {
                setError(e);
                setBusy(false);
              });
          }}
        />
        <Note>
          {lang === "ko"
            ? "계정 없이, 가볍게 시작해요."
            : "Start without creating an account."}
        </Note>
      </View>
    </Page>
  );
}
