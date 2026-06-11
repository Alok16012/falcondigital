import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePosterCopy } from "@/lib/claude";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { copy, source } = await generatePosterCopy({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      mrp: product.mrp,
      brandColor: product.brandColor,
    });

    return NextResponse.json({ copy, source });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate copy." }, { status: 500 });
  }
}
