import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runProductAutomation } from "@/lib/automation";

export async function GET() {
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, mrp, category, imageUrl, brandColor, stock, autoPublish } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required." }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name: String(name),
        description: String(description ?? ""),
        price: Number(price) || 0,
        mrp: Number(mrp) || Number(price) || 0,
        category: String(category),
        imageUrl: String(imageUrl ?? ""),
        brandColor: String(brandColor ?? "#6366F1"),
        stock: Number(stock) || 0,
      },
    });

    // Auto-pipeline: AI copy → social post → ecom listings.
    // Runs in background unless autoPublish === false.
    if (autoPublish !== false) {
      runProductAutomation(product.id)
        .then((s) =>
          console.log(
            `[automation] ${product.name}: social=${s.social?.status ?? "skipped"}, listings=${s.listings.length}`,
          ),
        )
        .catch((e) => console.error(`[automation] failed for ${product.name}:`, e));
    }

    return NextResponse.json({ ...product, automation: autoPublish !== false ? "started" : "off" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
