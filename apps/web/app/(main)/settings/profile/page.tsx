// Redirect /settings/profile to /settings (profile tab is default)
import { redirect } from "next/navigation";

export default function SettingsProfilePage() {
  redirect("/settings");
}
