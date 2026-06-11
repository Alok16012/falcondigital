"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";

export function AddPlatform({
  kind,
  noun,
}: {
  kind: "social" | "ecom";
  noun: string; // e.g. "platform" or "marketplace"
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!label.trim()) {
      setError(`Enter a ${noun} name.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label, apiKey: apiKey || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setLabel("");
      setApiKey("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        Add {noun}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-slate-50 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">New {noun}</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="text-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        <input
          className="input"
          placeholder={`Name (e.g. ${kind === "social" ? "YouTube" : "Shopify"})`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
        />
        <input
          className="input font-mono"
          type="password"
          placeholder="API key / token (optional)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        {error && <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-600">{error}</p>}
        <button onClick={add} disabled={saving} className="btn-accent w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {saving ? "Adding…" : `Add ${noun}`}
        </button>
      </div>
    </div>
  );
}

export async function deleteCustomPlatform(slug: string) {
  await fetch(`/api/platforms?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
}
