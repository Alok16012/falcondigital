import { db } from "@/lib/db";
import { ListingsClient } from "@/components/listings/ListingsClient";
import { getEcomPlatforms, getEcomConfigured } from "@/lib/ecom";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const [products, listings, platforms, configured] = await Promise.all([
    db.product.findMany({ orderBy: { createdAt: "desc" } }),
    db.ecomListing.findMany({ orderBy: { createdAt: "desc" }, include: { product: true } }),
    getEcomPlatforms(),
    getEcomConfigured(),
  ]);

  return (
    <ListingsClient
      products={products.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl }))}
      listings={listings.map((l) => ({
        id: l.id,
        platform: l.platform,
        status: l.status,
        platformId: l.platformId,
        error: l.error,
        createdAt: l.createdAt.toISOString(),
        product: { name: l.product.name },
      }))}
      platforms={platforms}
      configured={configured}
    />
  );
}
