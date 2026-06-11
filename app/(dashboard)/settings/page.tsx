import { getKeyStatus } from "@/lib/settings";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const status = await getKeyStatus();
  return <SettingsClient initialStatus={status} />;
}
