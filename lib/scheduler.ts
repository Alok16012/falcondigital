import { db } from "@/lib/db";
import { postToPlatform } from "@/lib/social";

// Process all pending posts whose scheduled time has arrived.
export async function processDuePosts(now = new Date()) {
  const due = await db.scheduledPost.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
  });

  const results: { id: string; status: string }[] = [];

  for (const post of due) {
    const platforms: string[] = JSON.parse(post.platforms || "[]");
    const outcomes = await Promise.all(
      platforms.map((p) =>
        postToPlatform(p, { caption: post.caption, posterUrl: post.posterUrl }),
      ),
    );
    const anyOk = outcomes.some((o) => o.ok);
    const allOk = outcomes.every((o) => o.ok);

    const status = allOk ? "posted" : anyOk ? "posted" : "failed";
    await db.scheduledPost.update({
      where: { id: post.id },
      data: {
        status,
        postedAt: anyOk ? new Date() : null,
      },
    });
    results.push({ id: post.id, status });
  }

  return { processed: results.length, results };
}
