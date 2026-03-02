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
  Tv,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: "inbox" | "production";
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
      { href: "/inbox", label: "Hộp sản phẩm", icon: Inbox, badgeKey: "inbox" },
      { href: "/production", label: "Sản xuất", icon: Clapperboard, badgeKey: "production" },
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

const STORAGE_KEY = "pastr-sidebar-collapsed";

type BadgeCounts = { inbox: number; production: number };

function ThemeToggle({ collapsed }: { collapsed: boolean }): React.ReactElement | null {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0",
        collapsed && "mx-auto"
      )}
      aria-label="Chuyển giao diện"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function NavLink({
  item,
  isActive,
  collapsed,
  badge,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  badge?: number;
}): React.ReactElement {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-r-xl text-sm transition-colors border-l-[3px]",
        collapsed && "justify-center px-0 border-l-0 rounded-xl",
        isActive
          ? "border-l-[#E87B35] bg-orange-50 text-orange-700 font-medium dark:border-l-[#FF8F47] dark:bg-orange-950/20 dark:text-orange-400"
          : "border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
      )}
    >
      <div className="relative shrink-0">
        <Icon className="w-4 h-4" />
        {/* Badge shown on icon when collapsed */}
        {collapsed && badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-bold px-0.5 leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {badge && badge > 0 && (
            <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-[11px] font-semibold px-1.5 leading-none shrink-0">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({ inbox: 0, production: 0 });

  const checkActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Restore collapsed state from localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  // Dispatch event so SidebarAwareMain can adjust margin
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
    window.dispatchEvent(new CustomEvent("sidebar-collapsed-change", { detail: collapsed }));
  }, [collapsed, mounted]);

  // Fetch badge counts on mount and route changes — non-blocking
  useEffect(() => {
    let cancelled = false;

    async function fetchBadges(): Promise<void> {
      try {
        const [inboxRes, prodRes] = await Promise.all([
          fetch("/api/inbox?pageSize=1&state=new"),
          fetch("/api/production?status=in_progress"),
        ]);

        const results: Partial<BadgeCounts> = {};

        if (inboxRes.ok) {
          const data = await inboxRes.json() as { stats?: { new?: number } };
          results.inbox = data?.stats?.new ?? 0;
        }

        if (prodRes.ok) {
          const data = await prodRes.json() as { total?: number; pagination?: { total?: number } };
          results.production = data?.pagination?.total ?? data?.total ?? 0;
        }

        if (!cancelled) {
          setBadges((prev) => ({ ...prev, ...results }));
        }
      } catch {
        // Badge fetch failures are silent — sidebar still renders
      }
    }

    void fetchBadges();
    return () => { cancelled = true; };
  }, [pathname]);

  function toggleCollapse(): void {
    setCollapsed((prev) => !prev);
  }

  // Sidebar width: w-60 expanded, w-16 collapsed — use transition for smooth animation
  const sidebarWidth = mounted ? (collapsed ? "w-16" : "w-60") : "w-60";

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-40 transition-[width] duration-200 overflow-hidden",
          sidebarWidth
        )}
      >
        {/* Logo */}
        <div className={cn("h-16 flex items-center shrink-0 overflow-hidden", collapsed ? "justify-center px-0" : "px-5")}>
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0"
            title={collapsed ? "PASTR" : undefined}
          >
            <span className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
              P
            </span>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50 whitespace-nowrap">
                PASTR
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 py-2 overflow-y-auto overflow-x-hidden", collapsed ? "px-1" : "px-3")}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.title} className={gi > 0 ? "mt-6" : ""}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 whitespace-nowrap">
                  {group.title}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="mx-auto w-6 border-t border-gray-200 dark:border-slate-700 mb-2 mt-1" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={checkActive(item.href)}
                    collapsed={collapsed}
                    badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: theme toggle + collapse button */}
        <div className={cn("py-3 border-t border-gray-100 dark:border-slate-800 shrink-0", collapsed ? "px-1" : "px-3")}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <ThemeToggle collapsed={collapsed} />
              <button
                onClick={toggleCollapse}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Mở sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                Giao diện
              </span>
              <div className="flex items-center gap-1">
                <ThemeToggle collapsed={collapsed} />
                <button
                  onClick={toggleCollapse}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Thu gọn sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <MobileNav />
    </>
  );
}
