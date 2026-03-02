"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, Inbox, Clapperboard, Tv, FileText,
  RefreshCw, BookOpen, TrendingUp, HelpCircle, Settings,
  Search, ArrowRight,
} from "lucide-react";

interface NavCommandItem {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
  keywords?: string[];
}

const NAV_COMMANDS: NavCommandItem[] = [
  { label: "Tổng quan", href: "/", icon: LayoutDashboard, group: "Trang", keywords: ["dashboard", "home"] },
  { label: "Hộp sản phẩm", href: "/inbox", icon: Inbox, group: "Trang", keywords: ["inbox", "san pham", "product"] },
  { label: "Sản xuất", href: "/production", icon: Clapperboard, group: "Trang", keywords: ["production", "brief", "video"] },
  { label: "Kênh TikTok", href: "/channels", icon: Tv, group: "Trang", keywords: ["channel", "kenh", "tiktok"] },
  { label: "Nhật ký", href: "/log", icon: FileText, group: "Trang", keywords: ["log", "nhat ky", "tracking"] },
  { label: "Đồng bộ dữ liệu", href: "/sync", icon: RefreshCw, group: "Trang", keywords: ["sync", "import", "upload"] },
  { label: "Thư viện", href: "/library", icon: BookOpen, group: "Trang", keywords: ["library", "thu vien", "asset"] },
  { label: "Phân tích", href: "/insights", icon: TrendingUp, group: "Trang", keywords: ["insights", "analytics", "phan tich"] },
  { label: "Hướng dẫn", href: "/guide", icon: HelpCircle, group: "Trang", keywords: ["guide", "help", "huong dan"] },
  { label: "Cài đặt", href: "/settings", icon: Settings, group: "Trang", keywords: ["settings", "cai dat", "api key"] },
];

export function CommandPalette(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleSelect(href: string): void {
    setOpen(false);
    router.push(href);
  }

  if (!open) return <></>;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command panel */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
          label="Tìm kiếm nhanh"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-gray-100 dark:border-slate-800">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <Command.Input
              placeholder="Gõ để tìm kiếm..."
              className="flex-1 py-3.5 text-sm bg-transparent outline-none placeholder:text-gray-400 dark:text-gray-50"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Không tìm thấy kết quả
            </Command.Empty>

            <Command.Group heading="Trang" className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 py-1">
                Điều hướng
              </p>
              {NAV_COMMANDS.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 cursor-pointer data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-700 dark:data-[selected=true]:bg-orange-950/30 dark:data-[selected=true]:text-orange-400 transition-colors"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 data-[selected=true]:opacity-100 transition-opacity" />
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 font-mono">↑↓</kbd>
              di chuyển
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 font-mono">↵</kbd>
              chọn
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 font-mono">esc</kbd>
              đóng
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
