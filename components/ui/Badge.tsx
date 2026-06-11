import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  posted: "bg-emerald-50 text-emerald-600",
  listed: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  scheduled: "bg-indigo-50 text-indigo-600",
  failed: "bg-rose-50 text-rose-600",
  error: "bg-rose-50 text-rose-600",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const dot: Record<string, string> = {
    posted: "bg-emerald-500",
    listed: "bg-emerald-500",
    pending: "bg-amber-500",
    scheduled: "bg-indigo-500",
    failed: "bg-rose-500",
    error: "bg-rose-500",
  };
  return (
    <span className={cn("pill capitalize", STYLES[key] ?? "bg-slate-100 text-slate-600")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[key] ?? "bg-slate-400")} />
      {status}
    </span>
  );
}
