"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, Package, ImageIcon, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { formatINR, discountPct } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  imageUrl: string;
  brandColor: string;
  stock: number;
}

const EMPTY = {
  name: "",
  description: "",
  price: "",
  mrp: "",
  category: "",
  imageUrl: "",
  brandColor: "#6366F1",
  stock: "",
};

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set("imageUrl", data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      setForm({ ...EMPTY });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {initialProducts.length} item{initialProducts.length !== 1 && "s"} in your catalog
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-accent">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {initialProducts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-lav">
            <Package className="h-6 w-6 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink">No products yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Add your first product to start designing posters and listing across marketplaces.
          </p>
          <button onClick={() => setOpen(true)} className="btn-primary mt-5">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {initialProducts.map((p) => {
            const off = discountPct(p.mrp, p.price);
            return (
              <div key={p.id} className="card group overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <span
                    className="absolute left-3 top-3 h-6 w-6 rounded-full border-2 border-white shadow"
                    style={{ background: p.brandColor }}
                    title={p.brandColor}
                  />
                  {off > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                      {off}% OFF
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="pill bg-slate-100 text-slate-600">{p.category}</p>
                      <h3 className="mt-1.5 truncate text-base font-semibold text-ink">{p.name}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg font-bold text-ink">{formatINR(p.price)}</span>
                    {p.mrp > p.price && (
                      <span className="text-sm text-muted line-through">{formatINR(p.mrp)}</span>
                    )}
                    <span className="ml-auto text-xs text-muted">Stock: {p.stock}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Product" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Product name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Wireless Earbuds Pro"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[80px] resize-none"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Key features and selling points…"
              />
            </div>
            <div>
              <label className="label">Selling price (₹)</label>
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="1499"
                required
              />
            </div>
            <div>
              <label className="label">MRP (₹)</label>
              <input
                type="number"
                className="input"
                value={form.mrp}
                onChange={(e) => set("mrp", e.target.value)}
                placeholder="2999"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                className="input"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Electronics"
                required
              />
            </div>
            <div>
              <label className="label">Stock</label>
              <input
                type="number"
                className="input"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="100"
              />
            </div>
            <div>
              <label className="label">Brand color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-white p-1"
                  value={form.brandColor}
                  onChange={(e) => set("brandColor", e.target.value)}
                />
                <input
                  className="input font-mono"
                  value={form.brandColor}
                  onChange={(e) => set("brandColor", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Product image</label>
              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-slate-50 text-sm text-muted transition hover:border-accent hover:text-ink">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : form.imageUrl ? "Change image" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {form.imageUrl && (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="preview" className="h-14 w-14 rounded-lg object-cover" />
              <span className="truncate text-xs text-muted">{form.imageUrl}</span>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-accent">
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
