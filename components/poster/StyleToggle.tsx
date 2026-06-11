"use client";

import { cn } from "@/lib/utils";

export type PosterStyle = "simple" | "detailed";

export function StyleToggle({
  value,
  onChange,
}: {
  value: PosterStyle;
  onChange: (v: PosterStyle) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-slate-50 p-1">
      {(["simple", "detailed"] as PosterStyle[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
            value === s ? "bg-white text-ink shadow-soft" : "text-muted hover:text-ink",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
