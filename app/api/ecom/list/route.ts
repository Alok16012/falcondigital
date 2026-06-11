import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listOnPlatform } from "@/lib/ecom";

export async function POST(req: Request) {
  try {
    const { productId, platforms } = await req.json();
    if (!productId || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: "Product and at least one platform are required." },
        { status: 400 },
      );
    }
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const payload = {
      name: product.name,
      description: product.description,
      price: product.price,
      mrp: product.mrp,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock,
    };

    const listings = [];
    for (const platform of platforms) {
      const result = await listOnPlatform(platform, payload);
      const listing = await db.ecomListing.create({
        data: {
          productId,
          platform,
          status: result.ok ? "listed" : "error",
          platformId: result.platformId ?? null,
          error: result.error ?? null,
        },
      });
      listings.push(listing);
    }

    return NextResponse.json({ ok: true, listings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list." }, { status: 500 });
  }
}
