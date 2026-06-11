import { db } from "@/lib/db";

export interface PostResult {
  ok: boolean;
  platformPostId?: string;
  error?: string;
}

export interface PostPayload {
  caption: string;
  posterUrl: string;
}

export interface Platform {
  id: string;
  label: string;
  custom: boolean;
}

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", envKeys: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ID"] },
  { id: "facebook", label: "Facebook", envKeys: ["FACEBOOK_PAGE_TOKEN", "FACEBOOK_PAGE_ID"] },
  { id: "twitter", label: "Twitter / X", envKeys: ["TWITTER_API_KEY", "TWITTER_ACCESS_TOKEN"] },
  { id: "linkedin", label: "LinkedIn", envKeys: ["LINKEDIN_ACCESS_TOKEN"] },
  { id: "whatsapp", label: "WhatsApp", envKeys: ["FACEBOOK_PAGE_TOKEN"] },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];

function builtinConfigured(id: string): boolean {
  const p = SOCIAL_PLATFORMS.find((x) => x.id === id);
  if (!p) return false;
  return p.envKeys.every((k) => Boolean(process.env[k]));
}

// Built-in only (sync). Kept for backwards compatibility.
export function platformConfigured(id: string): boolean {
  return builtinConfigured(id);
}

// Built-in + user-added custom platforms (async, hits the DB).
export async function platformConfiguredAsync(id: string): Promise<boolean> {
  if (SOCIAL_PLATFORMS.some((x) => x.id === id)) return builtinConfigured(id);
  const custom = await db.customPlatform.findFirst({ where: { kind: "social", slug: id } });
  return Boolean(custom?.apiKey);
}

// Returns built-in platforms followed by any user-added ones.
export async function getSocialPlatforms(): Promise<Platform[]> {
  const custom = await db.customPlatform.findMany({
    where: { kind: "social" },
    orderBy: { createdAt: "asc" },
  });
  return [
    ...SOCIAL_PLATFORMS.map((p) => ({ id: p.id, label: p.label, custom: false })),
    ...custom.map((c) => ({ id: c.slug, label: c.label, custom: true })),
  ];
}

// configured-status map for every platform (built-in + custom).
export async function getSocialConfigured(): Promise<Record<string, boolean>> {
  const platforms = await getSocialPlatforms();
  const status: Record<string, boolean> = {};
  for (const p of platforms) status[p.id] = await platformConfiguredAsync(p.id);
  return status;
}

// Real platform integrations live in lib/social/providers.ts.
export async function postToPlatform(
  platform: string,
  payload: PostPayload,
): Promise<PostResult> {
  if (!(await platformConfiguredAsync(platform))) {
    return { ok: false, error: `${platform} not configured — add API tokens in Settings.` };
  }

  const { SOCIAL_PROVIDERS } = await import("@/lib/social/providers");
  const provider = SOCIAL_PROVIDERS[platform];
  if (provider) return provider(payload);

  // Custom user-added platforms have no built-in API — mark as manual.
  return { ok: false, error: `${platform}: custom platform, no API integration available.` };
}
