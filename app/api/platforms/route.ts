import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { ECOM_PLATFORMS } from "@/lib/ecom";

const RESERVED = new Set<string>([
  ...SOCIAL_PLATFORMS.map((p) => p.id),
  ...ECOM_PLATFORMS.map((p) => p.id),
]);

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const custom = await db.customPlatform.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(
    custom.map((c) => ({ id: c.id, kind: c.kind, slug: c.slug, label: c.label, hasKey: Boolean(c.apiKey) })),
  );
}

export async function POST(req: Request) {
  try {
    const { kind, label, apiKey } = await req.json();

    if (kind !== "social" && kind !== "ecom") {
      return NextResponse.json({ error: "kind must be 'social' or 'ecom'." }, { status: 400 });
    }
    if (!label || typeof label !== "string" || !label.trim()) {
      return NextResponse.json({ error: "Platform name is required." }, { status: 400 });
    }

    const slug = slugify(label);
    if (!slug) {
      return NextResponse.json({ error: "Please use letters or numbers in the name." }, { status: 400 });
    }
    if (RESERVED.has(slug)) {
      return NextResponse.json({ error: `"${label}" is already a built-in platform.` }, { status: 409 });
    }
    const existing = await db.customPlatform.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: `"${label}" already exists.` }, { status: 409 });
    }

    const created = await db.customPlatform.create({
      data: {
        kind,
        slug,
        label: label.trim(),
        apiKey: typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : null,
      },
    });
    return NextResponse.json(
      { id: created.id, kind: created.kind, slug: created.slug, label: created.label, hasKey: Boolean(created.apiKey) },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add platform." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    if (!id && !slug) {
      return NextResponse.json({ error: "id or slug is required." }, { status: 400 });
    }
    await db.customPlatform.deleteMany({ where: id ? { id } : { slug: slug! } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to remove platform." }, { status: 500 });
  }
}
