"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wand2,
  CalendarClock,
  Store,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: null,
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/poster", label: "Poster Designer", icon: Wand2 },
    ],
  },
  {
    label: "Publish",
    items: [
      { href: "/scheduler", label: "Scheduler", icon: CalendarClock },
      { href: "/listings", label: "Ecom Listings", icon: Store },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white/70 px-4 py-6 backdrop-blur lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-ink">SellerHub</p>
          <p className="text-[11px] text-muted">Sell everywhere</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-6">
        {SECTIONS.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-gradient-lav text-ink shadow-soft"
                        : "text-muted hover:bg-slate-50 hover:text-ink",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] transition",
                        active ? "text-indigo-500" : "text-muted group-hover:text-ink",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl bg-gradient-blue p-4">
        <p className="text-sm font-semibold text-ink">Need API keys?</p>
        <p className="mt-1 text-xs text-muted">
          Add your social & marketplace tokens to go live.
        </p>
        <Link
          href="/settings"
          className="mt-3 inline-flex text-xs font-semibold text-indigo-600 hover:underline"
        >
          Open Settings →
        </Link>
      </div>
    </aside>
  );
}
