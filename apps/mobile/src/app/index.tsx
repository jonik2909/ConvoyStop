import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useSession } from "../lib/session";
import { useTheme } from "../lib/theme";
import Home from "../screens/home";
import Welcome from "../screens/welcome";
import Trip from "../screens/trip";
/** This native root never unmounts when onboarding or a trip changes. Back cannot undo those events. */
export default function RootScreen() {
  const onboarded = useSession((s) => s.onboarded);
  const session = useSession((s) => s.session);
  const c = useTheme();
  return (
    <View
      style={{ flex: 1, backgroundColor: c.bg }}
      onLayout={() => void SplashScreen.hideAsync()}
    >
      {!onboarded ? <Welcome /> : session ? <Trip /> : <Home />}
    </View>
  );
}
