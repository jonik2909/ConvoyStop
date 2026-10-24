import { useColorScheme } from "react-native";
import { useSession } from "./session";
const common = {
  accent: "#D4ED7A",
  onAccent: "#17200C",
  danger: "#C63D45",
  hero: "#101418",
};
export const palettes = {
  dark: {
    ...common,
    dark: true,
    bg: "#101418",
    surface: "#1B2127",
    elevated: "#252D34",
    text: "#F6F7F8",
    secondary: "#A5AEB6",
    line: "#333D46",
    subtle: "#7D8994",
  },
  light: {
    ...common,
    dark: false,
    bg: "#F4F6F7",
    surface: "#FFFFFF",
    elevated: "#E8EDF0",
    text: "#12191F",
    secondary: "#53616D",
    line: "#D6DEE4",
    subtle: "#63717D",
  },
};
export function useTheme() {
  const scheme = useColorScheme();
  const mode = useSession((s) => s.theme);
  return palettes[
    (mode === "system" ? scheme : mode) === "dark" ? "dark" : "light"
  ];
}
