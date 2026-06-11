import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postToPlatform } from "@/lib/social";

// Manually fire a scheduled post now (used by the "Post now" button).
export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    const post = await db.scheduledPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    const platforms: string[] = JSON.parse(post.platforms || "[]");
    const outcomes = await Promise.all(
      platforms.map(async (p) => ({
        platform: p,
        ...(await postToPlatform(p, { caption: post.caption, posterUrl: post.posterUrl })),
      })),
    );
    const anyOk = outcomes.some((o) => o.ok);

    const updated = await db.scheduledPost.update({
      where: { id },
      data: {
        status: anyOk ? "posted" : "failed",
        postedAt: anyOk ? new Date() : null,
      },
    });
    return NextResponse.json({ post: updated, outcomes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to post." }, { status: 500 });
  }
}
