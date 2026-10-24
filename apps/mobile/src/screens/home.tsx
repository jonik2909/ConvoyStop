import { View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Button, CarHero, Label, Note, Page } from "../components/ui";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/theme";
export default function Home() {
  const t = useT(),
    c = useTheme(),
    router = useRouter();
  return (
    <Page>
      <View style={{ gap: 16, paddingTop: 8 }}>
        <Badge title="SEOUL → GANGNEUNG" />
        <Label kind="display">{t("noTrip")}</Label>
        <Label style={{ color: c.secondary }}>{t("welcomeDetail")}</Label>
      </View>
      <CarHero />
      <View style={{ gap: 12 }}>
        <Button
          title={t("create")}
          icon="plus"
          testID="new-trip"
          onPress={() => router.push("/create")}
        />
        <Button
          title={t("join")}
          icon="person.2"
          secondary
          onPress={() => router.push("/join")}
        />
        <Button
          title={t("demo")}
          quiet
          icon="play.circle"
          testID="explore-demo"
          onPress={() =>
            router.push({ pathname: "/create", params: { demo: "1" } })
          }
        />
      </View>
      <Note>{t("routeNote")}</Note>
      <Label
        kind="micro"
        style={{ color: c.secondary, textAlign: "center", paddingTop: 8 }}
      >
        CONVOYSTOP / IOS COMPANION
      </Label>
    </Page>
  );
}
