import Link from "next/link";
import {
  Package,
  CalendarClock,
  Store,
  Wand2,
  TrendingUp,
  ArrowUpRight,
  Bell,
} from "lucide-react";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

async function getStats() {
  const [products, scheduled, posted, listings] = await Promise.all([
    db.product.count(),
    db.scheduledPost.count({ where: { status: "pending" } }),
    db.scheduledPost.count({ where: { status: "posted" } }),
    db.ecomListing.count({ where: { status: "listed" } }),
  ]);
  const recentPosts = await db.scheduledPost.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
  return { products, scheduled, posted, listings, recentPosts };
}

export default async function DashboardPage() {
  const { products, scheduled, posted, listings, recentPosts } = await getStats();

  const stats = [
    { label: "Products", value: products, icon: Package, grad: "bg-gradient-lav", tint: "text-indigo-500" },
    { label: "Scheduled Posts", value: scheduled, icon: CalendarClock, grad: "bg-gradient-blue", tint: "text-sky-500" },
    { label: "Posts Published", value: posted, icon: TrendingUp, grad: "bg-gradient-mint", tint: "text-emerald-500" },
    { label: "Live Listings", value: listings, icon: Store, grad: "bg-gradient-lav", tint: "text-violet-500" },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Welcome back 👋</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Here&apos;s your store at a glance
          </h1>
        </div>
        <Link href="/products" className="btn-accent">
          <Package className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`card ${s.grad} p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-soft">
                  <Icon className={`h-5 w-5 ${s.tint}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted" />
              </div>
              <p className="mt-4 text-3xl font-bold text-ink">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Feature cards (Poster + Scheduler) */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FeatureCard
            href="/poster"
            grad="bg-gradient-lav"
            icon={<Wand2 className="h-6 w-6 text-indigo-500" />}
            title="AI Poster Designer"
            desc="Drop a product image, pick a brand color — AI writes the copy and renders a poster."
          />
          <FeatureCard
            href="/scheduler"
            grad="bg-gradient-blue"
            icon={<CalendarClock className="h-6 w-6 text-sky-500" />}
            title="Smart Scheduler"
            desc="Schedule posters to Instagram, Facebook, X, LinkedIn & WhatsApp at a fixed daily time."
          />
          <FeatureCard
            href="/listings"
            grad="bg-gradient-mint"
            icon={<Store className="h-6 w-6 text-emerald-500" />}
            title="One-click Listing"
            desc="List a product on Amazon, Meesho & Flipkart together with live status per platform."
          />
          <FeatureCard
            href="/products"
            grad="bg-gradient-lav"
            icon={<Package className="h-6 w-6 text-violet-500" />}
            title="Product Catalog"
            desc="Manage your catalog in one place — images, pricing, stock & brand colors."
          />
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted" />
            <h3 className="text-sm font-semibold text-ink">Recent Activity</h3>
          </div>
          <div className="mt-4 space-y-3">
            {recentPosts.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-muted">
                No activity yet. Create a poster and schedule your first post.
              </p>
            )}
            {recentPosts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.product.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(p.scheduledAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  href,
  grad,
  icon,
  title,
  desc,
}: {
  href: string;
  grad: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className={`card group ${grad} p-6 transition hover:shadow-pop`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-soft">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
        Open
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}
