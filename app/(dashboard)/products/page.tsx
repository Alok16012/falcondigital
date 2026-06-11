import { db } from "@/lib/db";
import { ProductsClient } from "@/components/products/ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });
  return <ProductsClient initialProducts={products} />;
}
