"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Store, Loader2, Rocket, AlertTriangle, X } from "lucide-react";
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
interface Listing {
  id: string;
  platform: string;
  status: string;
  platformId: string | null;
  error: string | null;
  createdAt: string;
  product: { name: string };
}

export function ListingsClient({
  products,
  listings,
  platforms,
  configured,
}: {
  products: Product[];
  listings: Listing[];
  platforms: Platform[];
  configured: Record<string, boolean>;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [selected, setSelected] = useState<string[]>(["amazon", "meesho", "flipkart"]);
  const [running, setRunning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const anyMissing = platforms.some((p) => !configured[p.id]);

  function toggle(id: string, on: boolean) {
    setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  }

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

  async function listNow() {
    setError("");
    if (selected.length === 0) {
      setError("Select at least one marketplace.");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch("/api/ecom/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, platforms: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to list");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Ecom Listings</h1>
        <p className="mt-1 text-sm text-muted">
          List a product across Amazon, Meesho & Flipkart in one click.
        </p>
      </div>

      {anyMissing && (
        <div className="card mb-6 flex items-start gap-3 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold text-ink">Some marketplaces need setup</p>
            <p className="text-muted">
              Add your seller API keys in{" "}
              <a href="/settings" className="font-medium text-indigo-600 hover:underline">
                Settings
              </a>{" "}
              to enable real listing. Platforms without keys will report &ldquo;needs setup&rdquo;.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Config */}
        <div className="card h-fit space-y-4 p-5">
          <div>
            <label className="label">Product</label>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Marketplaces</label>
            <div className="space-y-2">
              {platforms.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted" />
                    <span className="text-sm font-medium text-ink">{p.label}</span>
                    <span
                      className={`pill ${
                        configured[p.id]
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {configured[p.id] ? "ready" : "needs key"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.custom && (
                      <button
                        type="button"
                        onClick={() => removePlatform(p.id)}
                        disabled={removing === p.id}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-500"
                        title="Remove marketplace"
                      >
                        {removing === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <Toggle checked={selected.includes(p.id)} onChange={(on) => toggle(p.id, on)} />
                  </div>
                </div>
              ))}
              <AddPlatform kind="ecom" noun="marketplace" />
            </div>
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <button onClick={listNow} disabled={running} className="btn-accent w-full">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {running ? "Listing…" : "List Now"}
          </button>
        </div>

        {/* Results */}
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Listing Status</h3>
          </div>
          {listings.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">
              No listings yet. Pick a product and hit List Now.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-lav">
                    <Store className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {l.product.name}
                      <span className="ml-2 capitalize text-muted">· {l.platform}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {l.platformId ? `ID: ${l.platformId}` : l.error || "—"}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
