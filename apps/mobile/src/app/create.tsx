import { useLocalSearchParams } from "expo-router";
import { ProfileForm } from "../components/profile-form";
export default function Create() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  return <ProfileForm mode="create" demo={demo === "1"} />;
}
