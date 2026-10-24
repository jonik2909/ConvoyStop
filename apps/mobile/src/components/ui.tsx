import { type PropsWithChildren, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  ReduceMotion,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { carSource } from "../lib/assets";
import { useTheme } from "../lib/theme";
import { errorText, useT } from "../lib/i18n";
import { useSession } from "../lib/session";
export function Label({
  kind = "body",
  style,
  ...props
}: TextProps & {
  kind?: "display" | "title" | "heading" | "body" | "small" | "micro";
}) {
  const c = useTheme();
  return (
    <Text {...props} style={[{ color: c.text }, textStyles[kind], style]} />
  );
}
const textStyles = StyleSheet.create({
  display: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  heading: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 13, lineHeight: 20 },
  micro: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
});
export function Icon({
  name,
  size = 20,
  color,
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color?: string;
}) {
  const c = useTheme();
  return (
    <SymbolView
      name={name}
      tintColor={color ?? c.text}
      size={size}
      weight="medium"
    />
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  quiet = false,
  disabled = false,
  busy = false,
  icon,
  testID,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  quiet?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: SymbolViewProps["name"];
  testID?: string;
}) {
  const c = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() =>
    reduced
      ? { opacity: scale.get() }
      : { transform: [{ scale: scale.get() }] },
  );
  const foreground = quiet ? c.text : secondary ? c.text : c.onAccent;
  return (
    <Animated.View style={motion}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        testID={testID}
        accessibilityState={{ disabled: disabled || busy, busy }}
        disabled={disabled || busy}
        onPressIn={() =>
          scale.set(
            withSpring(reduced ? 0.72 : 0.975, {
              duration: 120,
              dampingRatio: 1,
              reduceMotion: ReduceMotion.System,
            }),
          )
        }
        onPressOut={() =>
          scale.set(
            withSpring(1, {
              duration: 180,
              dampingRatio: 1,
              reduceMotion: ReduceMotion.System,
            }),
          )
        }
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[
          styles.button,
          {
            backgroundColor: quiet
              ? "transparent"
              : secondary
                ? c.elevated
                : c.accent,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={foreground} />
        ) : icon ? (
          <Icon name={icon} color={foreground} />
        ) : null}
        <Label
          style={{
            color: foreground,
            fontWeight: "600",
            textAlign: "center",
            flexShrink: 1,
          }}
        >
          {title}
        </Label>
      </Pressable>
    </Animated.View>
  );
}
export function Row({
  title,
  detail,
  icon,
  onPress,
  trailing,
  testID,
}: {
  title: string;
  detail?: string;
  icon?: SymbolViewProps["name"];
  onPress?: () => void;
  trailing?: React.ReactNode;
  testID?: string;
}) {
  const c = useTheme();
  const body = (
    <View style={styles.row}>
      {icon && (
        <View style={{ width: 28 }}>
          <Icon name={icon} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Label>{title}</Label>
        {detail && (
          <Label kind="small" style={{ color: c.secondary }}>
            {detail}
          </Label>
        )}
      </View>
      {trailing ??
        (onPress ? (
          <Icon name="chevron.right" size={14} color={c.secondary} />
        ) : null)}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? c.elevated : "transparent",
      })}
    >
      {body}
    </Pressable>
  ) : (
    body
  );
}
export function Section({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const c = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: c.surface }, style]}>
      {children}
    </View>
  );
}
export function Divider() {
  const c = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: c.line,
        marginHorizontal: 16,
      }}
    />
  );
}
export function Page({
  children,
  style,
  ...props
}: PropsWithChildren<ComponentProps<typeof ScrollView>>) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...props}
      style={[{ flex: 1, backgroundColor: c.bg }, style]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[
        {
          padding: 24,
          paddingBottom: Math.max(insets.bottom, 24) + 32,
          gap: 24,
        },
        props.contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}
export function ErrorNotice({ error }: { error: unknown }) {
  const c = useTheme();
  const lang = useSession((s) => s.language);
  if (!error) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.notice, { borderColor: c.danger }]}
    >
      <Icon name="exclamationmark.circle" color={c.danger} />
      <Label kind="small" style={{ flex: 1 }}>
        {errorText(error, lang)}
      </Label>
    </View>
  );
}
export function Note({
  children,
  icon = "info.circle",
}: PropsWithChildren<{ icon?: SymbolViewProps["name"] }>) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <Icon name={icon} size={14} color={c.secondary} />
      <Label kind="small" style={{ color: c.secondary, flex: 1 }}>
        {children}
      </Label>
    </View>
  );
}
export function Badge({ title }: { title: string }) {
  const c = useTheme();
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 8,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: c.line,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Label kind="micro" style={{ color: c.secondary }}>
        {title}
      </Label>
    </View>
  );
}
export function CarHero({ compact = false }: { compact?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: "#101418",
        borderRadius: 16,
        borderCurve: "continuous",
        overflow: "hidden",
      }}
    >
      <Image
        source={carSource()}
        contentFit="contain"
        style={{ width: "100%", aspectRatio: compact ? 2.1 : 1.77 }}
        accessibilityLabel="ConvoyStop silver touring car illustration"
      />
    </View>
  );
}
export function StateReveal({
  children,
  id,
}: PropsWithChildren<{ id: string }>) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      key={id}
      entering={FadeIn.duration(reduced ? 100 : 220)}
      exiting={FadeOut.duration(100)}
      style={{ gap: 16 }}
    >
      {children}
    </Animated.View>
  );
}
export function Loading() {
  const c = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        justifyContent: "center",
        padding: 24,
        gap: 16,
      }}
    >
      <ActivityIndicator color={c.text} />
    </View>
  );
}
export function SeedNote() {
  const t = useT();
  return <Note>{t("seed")}</Note>;
}
export const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 999,
    borderCurve: "continuous",
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  row: {
    minHeight: 60,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  section: { borderRadius: 16, borderCurve: "continuous", overflow: "hidden" },
  notice: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: "continuous",
    padding: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
});
