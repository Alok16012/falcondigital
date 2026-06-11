import { db } from "@/lib/db";
import { PosterDesigner } from "@/components/poster/PosterDesigner";

export const dynamic = "force-dynamic";

export default async function PosterPage() {
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });
  return <PosterDesigner products={products} />;
}
