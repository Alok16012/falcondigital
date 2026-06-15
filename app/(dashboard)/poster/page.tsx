import { db } from "@/lib/db";
import { PosterDesigner } from "@/components/poster/PosterDesigner";

export const dynamic = "force-dynamic";

async function getProducts() {
  try {
    return await db.product.findMany({ orderBy: { createdAt: "desc" } });
  } catch (e) {
    console.error("[poster] DB unavailable:", e);
    return [];
  }
}

export default async function PosterPage() {
  const products = await getProducts();
  return <PosterDesigner products={products} />;
}
