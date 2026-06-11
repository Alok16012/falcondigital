import { NextResponse } from "next/server";
import { processDuePosts } from "@/lib/scheduler";
import { runCatchUp } from "@/lib/automation";

export const dynamic = "force-dynamic";

// Manual trigger / external cron (e.g. Vercel cron): publishes due posts AND
// runs the catch-up automation for products missing posts/listings.
export async function GET() {
  const posts = await processDuePosts();
  const catchUp = await runCatchUp();
  return NextResponse.json({
    ok: true,
    duePosts: posts,
    catchUp: { processed: catchUp.processed.length, productIds: catchUp.processed },
    ranAt: new Date().toISOString(),
  });
}
