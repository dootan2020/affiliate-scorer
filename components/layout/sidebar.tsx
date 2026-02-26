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
  Clapperboard,
  FileText,
  BookOpen,
  TrendingUp,
  HelpCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Công việc hàng ngày",
    items: [
      { href: "/", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/inbox", label: "Hộp sản phẩm", icon: Inbox },
      { href: "/sync", label: "Đồng bộ dữ liệu", icon: RefreshCw },
      { href: "/production", label: "Sản xuất", icon: Clapperboard },
      { href: "/log", label: "Nhật ký", icon: FileText },
    ],
  },
  {
    title: "Phân tích & Học",
    items: [
      { href: "/library", label: "Thư viện", icon: BookOpen },
      { href: "/insights", label: "Phân tích", icon: TrendingUp },
    ],
  },
  {
    title: "Hỗ trợ",
    items: [
      { href: "/guide", label: "Hướng dẫn", icon: HelpCircle },
      { href: "/settings", label: "Cài đặt", icon: Settings },
    ],
  },
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

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }): React.ReactElement {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-r-xl text-sm transition-colors border-l-[3px]",
        isActive
          ? "border-l-[#E87B35] bg-orange-50 text-orange-700 font-medium dark:border-l-[#FF8F47] dark:bg-orange-950/20 dark:text-orange-400"
          : "border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const checkActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40">
        <div className="px-5 h-16 flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-sm font-extrabold">P</span>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50">PASTR</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.title} className={gi > 0 ? "mt-6" : ""}>
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} isActive={checkActive(item.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Giao diện</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <MobileNav />
    </>
  );
}
