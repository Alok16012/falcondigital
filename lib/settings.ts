import { promises as fs } from "fs";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env.local");

export const MANAGED_KEYS = [
  "ANTHROPIC_API_KEY",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ID",
  "FACEBOOK_PAGE_TOKEN",
  "FACEBOOK_PAGE_ID",
  "TWITTER_API_KEY",
  "TWITTER_API_SECRET",
  "TWITTER_ACCESS_TOKEN",
  "TWITTER_ACCESS_SECRET",
  "LINKEDIN_ACCESS_TOKEN",
  "AMAZON_CLIENT_ID",
  "AMAZON_CLIENT_SECRET",
  "AMAZON_REFRESH_TOKEN",
  "AMAZON_MARKETPLACE_ID",
  "MEESHO_API_KEY",
  "FLIPKART_API_KEY",
  "FLIPKART_API_SECRET",
  "AMAZON_SELLER_ID",
  "FLIPKART_LOCATION_ID",
  "LINKEDIN_AUTHOR_URN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_RECIPIENT",
  "APP_PUBLIC_URL",
] as const;

export type ManagedKey = (typeof MANAGED_KEYS)[number];

async function readEnvFile(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(ENV_PATH, "utf-8");
    const map: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      map[key] = val;
    }
    return map;
  } catch {
    return {};
  }
}

// Returns whether each managed key has a value, without leaking the secret.
export async function getKeyStatus(): Promise<Record<string, boolean>> {
  const env = await readEnvFile();
  const status: Record<string, boolean> = {};
  for (const k of MANAGED_KEYS) {
    status[k] = Boolean(env[k] || process.env[k]);
  }
  return status;
}

export async function updateKeys(updates: Record<string, string>) {
  const env = await readEnvFile();
  // Preserve DATABASE_URL and any other existing keys.
  if (!env.DATABASE_URL) env.DATABASE_URL = "file:./dev.db";

  for (const [k, v] of Object.entries(updates)) {
    if (!MANAGED_KEYS.includes(k as ManagedKey)) continue;
    if (v === "") continue; // empty submission keeps existing value
    env[k] = v;
    process.env[k] = v; // apply to running process
  }

  const lines: string[] = [];
  if (env.DATABASE_URL) lines.push(`DATABASE_URL="${env.DATABASE_URL}"`);
  for (const k of MANAGED_KEYS) {
    lines.push(`${k}=${env[k] ?? ""}`);
  }
  await fs.writeFile(ENV_PATH, lines.join("\n") + "\n", "utf-8");
}
