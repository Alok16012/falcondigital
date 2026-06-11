import { db } from "@/lib/db";

export interface ListingResult {
  ok: boolean;
  platformId?: string;
  error?: string;
}

export interface ListingPayload {
  name: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  imageUrl: string;
  stock: number;
}

export interface EcomPlatform {
  id: string;
  label: string;
  custom: boolean;
}

export const ECOM_PLATFORMS = [
  { id: "amazon", label: "Amazon", envKeys: ["AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET", "AMAZON_REFRESH_TOKEN"] },
  { id: "meesho", label: "Meesho", envKeys: ["MEESHO_API_KEY"] },
  { id: "flipkart", label: "Flipkart", envKeys: ["FLIPKART_API_KEY", "FLIPKART_API_SECRET"] },
] as const;

export type EcomPlatformId = (typeof ECOM_PLATFORMS)[number]["id"];

function builtinEcomConfigured(id: string): boolean {
  const p = ECOM_PLATFORMS.find((x) => x.id === id);
  if (!p) return false;
  return p.envKeys.every((k) => Boolean(process.env[k]));
}

// Built-in only (sync). Kept for backwards compatibility.
export function ecomConfigured(id: string): boolean {
  return builtinEcomConfigured(id);
}

// Built-in + user-added custom marketplaces (async, hits the DB).
export async function ecomConfiguredAsync(id: string): Promise<boolean> {
  if (ECOM_PLATFORMS.some((x) => x.id === id)) return builtinEcomConfigured(id);
  const custom = await db.customPlatform.findFirst({ where: { kind: "ecom", slug: id } });
  return Boolean(custom?.apiKey);
}

// Returns built-in marketplaces followed by any user-added ones.
export async function getEcomPlatforms(): Promise<EcomPlatform[]> {
  const custom = await db.customPlatform.findMany({
    where: { kind: "ecom" },
    orderBy: { createdAt: "asc" },
  });
  return [
    ...ECOM_PLATFORMS.map((p) => ({ id: p.id, label: p.label, custom: false })),
    ...custom.map((c) => ({ id: c.slug, label: c.label, custom: true })),
  ];
}

// configured-status map for every marketplace (built-in + custom).
export async function getEcomConfigured(): Promise<Record<string, boolean>> {
  const platforms = await getEcomPlatforms();
  const status: Record<string, boolean> = {};
  for (const p of platforms) status[p.id] = await ecomConfiguredAsync(p.id);
  return status;
}

// Real marketplace integrations live in lib/ecom/providers.ts.
export async function listOnPlatform(
  platform: string,
  payload: ListingPayload,
): Promise<ListingResult> {
  if (!(await ecomConfiguredAsync(platform))) {
    return { ok: false, error: `${platform} not configured — add seller API keys in Settings.` };
  }

  const { ECOM_PROVIDERS } = await import("@/lib/ecom/providers");
  const provider = ECOM_PROVIDERS[platform];
  if (provider) return provider(payload);

  // Custom user-added marketplaces have no built-in API — mark as manual.
  return { ok: false, error: `${platform}: custom marketplace, no API integration available.` };
}
