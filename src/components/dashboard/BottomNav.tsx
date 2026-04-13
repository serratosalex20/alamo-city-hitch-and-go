"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const navItems = [
  { icon: "local_shipping", label: "Fleet", href: "/fleet", active: false },
  { icon: "calendar_today", label: "Rentals", href: "/account", active: false },
  { icon: "build", label: "Support", href: "/support", active: false },
  { icon: "person", label: "Account", href: "/account", active: true },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 backdrop-blur-xl bg-background/90 border-t border-white/5 shadow-2xl"
      aria-label="Dashboard navigation"
    >
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          aria-label={item.label}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-2 transition-all ${
            item.active
              ? "text-red-500 bg-red-500/10 rounded-md px-4"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <Icon
            name={item.icon}
            filled={item.active}
            className="text-2xl"
          />
          <span className="font-body text-[10px] uppercase font-bold tracking-widest mt-1">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
