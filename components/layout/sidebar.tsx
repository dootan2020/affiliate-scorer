"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  LayoutDashboard,
  Inbox,
  RefreshCw,
  Film,
  ClipboardList,
  BookOpen,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/sync", label: "Sync", icon: RefreshCw },
  { href: "/production", label: "Sản xuất", icon: Film },
  { href: "/log", label: "Log", icon: ClipboardList },
  { href: "/library", label: "Thư viện", icon: BookOpen },
  { href: "/insights", label: "Insights", icon: Sparkles },
];

function ThemeToggle(): React.ReactElement | null {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Chuyển giao diện"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40">
        {/* App name */}
        <div className="px-5 h-16 flex items-center shrink-0">
          <Link href="/" className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Content Factory
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-r-xl text-sm transition-colors border-l-[3px]",
                  active
                    ? "border-l-[#E87B35] bg-orange-50 text-orange-700 font-medium dark:border-l-[#FF8F47] dark:bg-orange-950/20 dark:text-orange-400"
                    : "border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Settings + theme toggle */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-slate-800 shrink-0 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-r-xl text-sm transition-colors border-l-[3px]",
              isActive("/settings")
                ? "border-l-[#E87B35] bg-orange-50 text-orange-700 font-medium dark:border-l-[#FF8F47] dark:bg-orange-950/20 dark:text-orange-400"
                : "border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Cài đặt
          </Link>
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Giao diện
            </span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile nav (top bar + slide-over + bottom tabs) */}
      <MobileNav />
    </>
  );
}
