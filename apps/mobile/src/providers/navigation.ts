import { Linking } from "react-native";
import type { Stop } from "@convoy/domain";
export interface NavigationProvider {
  open(stop: Stop): Promise<void>;
}
export class IOSNavigationProvider implements NavigationProvider {
  async open(stop: Stop) {
    const url = `https://maps.apple.com/?daddr=${stop.lat},${stop.lng}&dirflg=d&q=${encodeURIComponent(stop.name)}`;
    await Linking.openURL(url);
  }
}
