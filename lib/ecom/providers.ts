import type { ListingPayload, ListingResult } from "@/lib/ecom";

function skuFor(name: string): string {
  return (
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) +
    "-" +
    Date.now().toString(36).toUpperCase()
  );
}

function publicUrl(url: string): string | null {
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.APP_PUBLIC_URL?.replace(/\/$/, "");
  return base ? `${base}${url.startsWith("/") ? "" : "/"}${url}` : null;
}

// ---------- Amazon (SP-API, India / EU region) ----------

async function amazonAccessToken(): Promise<string> {
  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.AMAZON_REFRESH_TOKEN!,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token)
    throw new Error(json?.error_description ?? "LWA token exchange failed");
  return json.access_token;
}

export async function listAmazon(p: ListingPayload): Promise<ListingResult> {
  try {
    const sellerId = process.env.AMAZON_SELLER_ID;
    if (!sellerId) return { ok: false, error: "Amazon: set AMAZON_SELLER_ID in Settings." };

    const token = await amazonAccessToken();
    const marketplaceId = process.env.AMAZON_MARKETPLACE_ID ?? "A21TJRUUN4KGV"; // amazon.in
    const sku = skuFor(p.name);
    const img = publicUrl(p.imageUrl);

    const res = await fetch(
      `https://sellingpartnerapi-eu.amazon.com/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(
        sku,
      )}?marketplaceIds=${marketplaceId}`,
      {
        method: "PUT",
        headers: {
          "x-amz-access-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productType: "PRODUCT",
          requirements: "LISTING_OFFER_ONLY",
          attributes: {
            item_name: [{ value: p.name, marketplace_id: marketplaceId }],
            product_description: [{ value: p.description, marketplace_id: marketplaceId }],
            purchasable_offer: [
              {
                currency: "INR",
                our_price: [{ schedule: [{ value_with_tax: p.price }] }],
                marketplace_id: marketplaceId,
              },
            ],
            fulfillment_availability: [{ fulfillment_channel_code: "DEFAULT", quantity: p.stock }],
            ...(img && {
              main_product_image_locator: [{ media_location: img, marketplace_id: marketplaceId }],
            }),
          },
        }),
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === "INVALID")
      throw new Error(
        json?.issues?.map((i: any) => i.message).join("; ") ?? json?.errors?.[0]?.message ?? `HTTP ${res.status}`,
      );
    return { ok: true, platformId: sku };
  } catch (e: any) {
    return { ok: false, error: `Amazon: ${e.message}` };
  }
}

// ---------- Flipkart (Seller API) ----------

async function flipkartAccessToken(): Promise<string> {
  const basic = Buffer.from(
    `${process.env.FLIPKART_API_KEY}:${process.env.FLIPKART_API_SECRET}`,
  ).toString("base64");
  const res = await fetch(
    "https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api",
    { headers: { Authorization: `Basic ${basic}` } },
  );
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(json?.error_description ?? "Flipkart auth failed");
  return json.access_token;
}

export async function listFlipkart(p: ListingPayload): Promise<ListingResult> {
  try {
    const token = await flipkartAccessToken();
    const sku = skuFor(p.name);

    const res = await fetch("https://api.flipkart.net/sellers/listings/v3/update", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        [sku]: {
          product_id: "",
          price: {
            mrp: p.mrp,
            selling_price: p.price,
            currency: "INR",
          },
          listing_status: "ACTIVE",
          shipping_fees: { local: 0, zonal: 0, national: 0, currency: "INR" },
          fulfillment_profile: "NON_FBF",
          fulfillment: { dispatch_sla: 2, procurement_type: "REGULAR" },
          packages: [],
          locations: process.env.FLIPKART_LOCATION_ID
            ? [{ id: process.env.FLIPKART_LOCATION_ID, status: "ENABLED", inventory: p.stock }]
            : [],
        },
      }),
    });
    const json = await res.json().catch(() => ({}));
    const result = json?.[sku];
    if (!res.ok || result?.status === "failure")
      throw new Error(result?.errors?.map((e: any) => e.description).join("; ") ?? `HTTP ${res.status}`);
    return { ok: true, platformId: sku };
  } catch (e: any) {
    return { ok: false, error: `Flipkart: ${e.message}` };
  }
}

// ---------- Meesho ----------
// Note: Meesho has no fully public seller API; this targets the supplier
// catalog endpoint and surfaces any error so you can adjust if needed.

export async function listMeesho(p: ListingPayload): Promise<ListingResult> {
  try {
    const img = publicUrl(p.imageUrl);
    const res = await fetch("https://supplier.meesho.com/api/v1/catalog/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MEESHO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        images: img ? [img] : [],
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
    return { ok: true, platformId: json.id ?? json.product_id ?? skuFor(p.name) };
  } catch (e: any) {
    return { ok: false, error: `Meesho: ${e.message}` };
  }
}

export const ECOM_PROVIDERS: Record<string, (p: ListingPayload) => Promise<ListingResult>> = {
  amazon: listAmazon,
  flipkart: listFlipkart,
  meesho: listMeesho,
};
