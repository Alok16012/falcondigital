import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePlatformCaption } from "@/lib/claude";

export async function GET() {
  const posts = await db.scheduledPost.findMany({
    orderBy: { scheduledAt: "desc" },
    include: { product: true },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  try {
    const { productId, posterUrl, platforms, time, caption } = await req.json();
    if (!productId || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: "Product and at least one platform are required." },
        { status: 400 },
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Build scheduledAt: next occurrence of HH:MM (today if still ahead, else tomorrow).
    const [h, m] = String(time || "10:00").split(":").map(Number);
    const scheduledAt = new Date();
    scheduledAt.setHours(h || 10, m || 0, 0, 0);
    if (scheduledAt.getTime() <= Date.now()) {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
    }

    const finalCaption =
      caption ||
      (await generatePlatformCaption(platforms[0], {
        name: product.name,
        description: product.description,
        category: product.category,
      }));

    const post = await db.scheduledPost.create({
      data: {
        productId,
        posterUrl: posterUrl || product.imageUrl,
        caption: finalCaption,
        platforms: JSON.stringify(platforms),
        scheduledAt,
        status: "pending",
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to schedule." }, { status: 500 });
  }
}
