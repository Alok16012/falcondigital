import { db } from "@/lib/db";
import { generatePosterCopy } from "@/lib/claude";
import { getSocialConfigured, postToPlatform } from "@/lib/social";
import { getEcomConfigured, listOnPlatform } from "@/lib/ecom";

export interface AutomationSummary {
  productId: string;
  social: { platforms: string[]; status: string } | null;
  listings: { platform: string; status: string; error?: string | null }[];
}

// Full pipeline for one product:
// 1. AI caption/copy  2. instant social post (all configured platforms)
// 3. ecom listing on all configured marketplaces.
export async function runProductAutomation(productId: string): Promise<AutomationSummary> {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  // --- 1. AI copy ---
  const { copy } = await generatePosterCopy({
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    mrp: product.mrp,
    brandColor: product.brandColor,
  });
  const caption = [copy.caption, copy.offer, copy.hashtags.join(" ")]
    .filter(Boolean)
    .join("\n\n");

  // --- 2. Social post on every configured platform ---
  let social: AutomationSummary["social"] = null;
  const socialStatus = await getSocialConfigured();
  const socialPlatforms = Object.keys(socialStatus).filter((k) => socialStatus[k]);

  if (socialPlatforms.length > 0) {
    const post = await db.scheduledPost.create({
      data: {
        productId: product.id,
        posterUrl: product.imageUrl,
        caption,
        platforms: JSON.stringify(socialPlatforms),
        scheduledAt: new Date(),
        status: "pending",
      },
    });

    const outcomes = await Promise.all(
      socialPlatforms.map((p) =>
        postToPlatform(p, { caption, posterUrl: product.imageUrl }),
      ),
    );
    const anyOk = outcomes.some((o) => o.ok);
    const status = anyOk ? "posted" : "failed";
    await db.scheduledPost.update({
      where: { id: post.id },
      data: { status, postedAt: anyOk ? new Date() : null },
    });
    social = { platforms: socialPlatforms, status };
  }

  // --- 3. Ecom listing on every configured marketplace (skip already-listed) ---
  const ecomStatus = await getEcomConfigured();
  const ecomPlatforms = Object.keys(ecomStatus).filter((k) => ecomStatus[k]);
  const existing = await db.ecomListing.findMany({
    where: { productId: product.id, status: "listed" },
    select: { platform: true },
  });
  const already = new Set(existing.map((l) => l.platform));

  const listings: AutomationSummary["listings"] = [];
  for (const platform of ecomPlatforms) {
    if (already.has(platform)) continue;
    const result = await listOnPlatform(platform, {
      name: product.name,
      description: product.description,
      price: product.price,
      mrp: product.mrp,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock,
    });
    const listing = await db.ecomListing.create({
      data: {
        productId: product.id,
        platform,
        status: result.ok ? "listed" : "error",
        platformId: result.platformId ?? null,
        error: result.error ?? null,
      },
    });
    listings.push({ platform, status: listing.status, error: listing.error });
  }

  return { productId: product.id, social, listings };
}

// Daily catch-up: run automation for products that have no post or no listing yet.
export async function runCatchUp(): Promise<{ processed: string[] }> {
  const products = await db.product.findMany({
    include: {
      posts: { select: { id: true }, take: 1 },
      listings: { where: { status: "listed" }, select: { id: true }, take: 1 },
    },
  });

  const pending = products.filter((p) => p.posts.length === 0 || p.listings.length === 0);
  const processed: string[] = [];

  for (const p of pending) {
    try {
      await runProductAutomation(p.id);
      processed.push(p.id);
    } catch (e) {
      console.error(`[automation] catch-up failed for ${p.name}:`, e);
    }
  }
  return { processed };
}
