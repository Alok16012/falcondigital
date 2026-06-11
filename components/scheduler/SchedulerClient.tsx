"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, Send, Loader2, X } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { StatusBadge } from "@/components/ui/Badge";
import { AddPlatform, deleteCustomPlatform } from "@/components/ui/AddPlatform";

interface Platform {
  id: string;
  label: string;
  custom: boolean;
}
interface Product {
  id: string;
  name: string;
  imageUrl: string;
}
interface Post {
  id: string;
  posterUrl: string;
  caption: string;
  platforms: string;
  scheduledAt: string;
  status: string;
  product: { name: string };
}

export function SchedulerClient({
  products,
  posts,
  defaultProductId,
  defaultPoster,
  platforms,
  configured,
}: {
  products: Product[];
  posts: Post[];
  defaultProductId?: string;
  defaultPoster?: string;
  platforms: Platform[];
  configured: Record<string, boolean>;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(defaultProductId || products[0]?.id || "");
  const [selected, setSelected] = useState<string[]>(["instagram"]);
  const [removing, setRemoving] = useState<string | null>(null);

  async function removePlatform(slug: string) {
    setRemoving(slug);
    try {
      await deleteCustomPlatform(slug);
      setSelected((s) => s.filter((x) => x !== slug));
      router.refresh();
    } finally {
      setRemoving(null);
    }
  }
  const [time, setTime] = useState("10:00");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState("");

  function togglePlatform(id: string, on: boolean) {
    setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  }

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (selected.length === 0) {
      setError("Select at least one platform.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/social/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          posterUrl: defaultPoster,
          platforms: selected,
          time,
          caption: caption || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCaption("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule");
    } finally {
      setSaving(false);
    }
  }

  async function postNow(id: string) {
    setRunning(id);
    try {
      await fetch("/api/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Scheduler</h1>
          <p className="mt-1 text-sm text-muted">
            Schedule posters to your social platforms at a fixed daily time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <form onSubmit={schedule} className="card h-fit space-y-4 p-5">
          <div>
            <label className="label">Product</label>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {defaultPoster && (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={defaultPoster} alt="poster" className="h-12 w-12 rounded-lg object-cover" />
              <span className="text-xs text-muted">Poster attached from designer</span>
            </div>
          )}

          <div>
            <label className="label">Platforms</label>
            <div className="space-y-2">
              {platforms.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{p.label}</span>
                    {p.custom && (
                      <span className="pill bg-indigo-50 text-indigo-600">custom</span>
                    )}
                    {!configured[p.id] && (
                      <span className="pill bg-amber-50 text-amber-600">no token</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.custom && (
                      <button
                        type="button"
                        onClick={() => removePlatform(p.id)}
                        disabled={removing === p.id}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-500"
                        title="Remove platform"
                      >
                        {removing === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <Toggle
                      checked={selected.includes(p.id)}
                      onChange={(on) => togglePlatform(p.id, on)}
                    />
                  </div>
                </div>
              ))}
              <AddPlatform kind="social" noun="platform" />
            </div>
          </div>

          <div>
            <label className="label">Daily post time</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div>
            <label className="label">Caption (optional — AI fills if empty)</label>
            <textarea
              className="input min-h-[70px] resize-none"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Leave blank to auto-generate with AI"
            />
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <button type="submit" disabled={saving} className="btn-accent w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {saving ? "Scheduling…" : "Schedule Post"}
          </button>
        </form>

        {/* Status table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Scheduled Posts</h3>
            <span className="text-xs text-muted">{posts.length} total</span>
          </div>

          {posts.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">
              No scheduled posts yet. Create one from the form.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {posts.map((post) => {
                const platforms: string[] = JSON.parse(post.platforms || "[]");
                return (
                  <div key={post.id} className="flex items-center gap-4 px-5 py-3.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.posterUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{post.product.name}</p>
                      <p className="truncate text-xs text-muted">{post.caption}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {platforms.map((pl) => (
                          <span key={pl} className="pill bg-slate-100 text-slate-500 capitalize">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs font-medium text-ink">
                        {new Date(post.scheduledAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <StatusBadge status={post.status} />
                    {post.status !== "posted" && (
                      <button
                        onClick={() => postNow(post.id)}
                        disabled={running === post.id}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-accent hover:text-accent"
                        title="Post now"
                      >
                        {running === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
