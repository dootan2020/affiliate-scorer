"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import {
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  Inbox,
  Clapperboard,
  FileText,
  RefreshCw,
  BookOpen,
  TrendingUp,
  HelpCircle,
  Settings,
  MoreHorizontal,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      { href: "/production", label: "Sản xuất", icon: Clapperboard },
      { href: "/channels", label: "Kênh TikTok", icon: Tv },
    ],
  },
  {
    title: "Dữ liệu",
    items: [
      { href: "/log", label: "Nhật ký", icon: FileText },
      { href: "/sync", label: "Đồng bộ dữ liệu", icon: RefreshCw },
      { href: "/library", label: "Thư viện", icon: BookOpen },
    ],
  },
  {
    title: "Phân tích",
    items: [
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

// Bottom tabs: Tổng quan, Hộp SP, Sản xuất, Kênh (channels replaces nhật ký)
const BOTTOM_TABS: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/inbox", label: "Hộp SP", icon: Inbox },
  { href: "/production", label: "Sản xuất", icon: Clapperboard },
  { href: "/channels", label: "Kênh", icon: Tv },
];

// Everything not in bottom tabs goes into overflow menu
const OVERFLOW_ITEMS: NavItem[] = [
  { href: "/log", label: "Nhật ký", icon: FileText },
  { href: "/sync", label: "Đồng bộ", icon: RefreshCw },
  { href: "/library", label: "Thư viện", icon: BookOpen },
  { href: "/insights", label: "Phân tích", icon: TrendingUp },
  { href: "/guide", label: "Hướng dẫn", icon: HelpCircle },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

function ThemeToggle(): React.ReactElement | null {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Chuyển giao diện"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function BottomOverflowMenu({ isActive }: { isActive: (href: string) => boolean }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const anyOverflowActive = OVERFLOW_ITEMS.some((i) => isActive(i.href));

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
          anyOverflowActive ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"
        )}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-medium">Thêm</span>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
          {OVERFLOW_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MobileNav(): React.ReactElement {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-base font-semibold text-gray-900 dark:text-gray-50">PASTR</span>
        <ThemeToggle />
      </header>

      {/* Slide-over drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-slate-800">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">PASTR</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDrawerOpen(false)}
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              {NAV_GROUPS.map((group, gi) => (
                <div key={group.title} className={gi > 0 ? "mt-5" : ""}>
                  <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {BOTTOM_TABS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
                  isActive(item.href) ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <BottomOverflowMenu isActive={isActive} />
        </div>
      </nav>
    </>
  );
}
