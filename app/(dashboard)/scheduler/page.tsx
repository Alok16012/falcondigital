import { db } from "@/lib/db";
import { SchedulerClient } from "@/components/scheduler/SchedulerClient";
import { getSocialPlatforms, getSocialConfigured } from "@/lib/social";

export const dynamic = "force-dynamic";

export default async function SchedulerPage({
  searchParams,
}: {
  searchParams: { productId?: string; poster?: string };
}) {
  const [products, posts, platforms, configured] = await Promise.all([
    db.product.findMany({ orderBy: { createdAt: "desc" } }),
    db.scheduledPost.findMany({ orderBy: { scheduledAt: "desc" }, include: { product: true } }),
    getSocialPlatforms(),
    getSocialConfigured(),
  ]);

  return (
    <SchedulerClient
      products={products.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl }))}
      posts={posts.map((p) => ({
        id: p.id,
        posterUrl: p.posterUrl,
        caption: p.caption,
        platforms: p.platforms,
        scheduledAt: p.scheduledAt.toISOString(),
        status: p.status,
        product: { name: p.product.name },
      }))}
      defaultProductId={searchParams.productId}
      defaultPoster={searchParams.poster}
      platforms={platforms}
      configured={configured}
    />
  );
}
