"use client";

import { Search, Bell } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg/80 px-5 py-4 backdrop-blur lg:px-8">
      <div className="lg:hidden">
        <p className="text-base font-bold tracking-tight text-ink">SellerHub</p>
      </div>

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          placeholder="Search products, posts, listings…"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:text-ink">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
            S
          </div>
          <span className="hidden text-sm font-medium text-ink sm:block">Seller</span>
        </div>
      </div>
    </header>
  );
}
