import { db } from "@/lib/db";
import { ProductsClient } from "@/components/products/ProductsClient";

export const dynamic = "force-dynamic";

async function getProducts() {
  try {
    return await db.product.findMany({ orderBy: { createdAt: "desc" } });
  } catch (e) {
    console.error("[products] DB unavailable:", e);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsClient initialProducts={products} />;
}
