"use client";

import { cn } from "@/lib/utils";

interface InsightsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "financial", label: "Thu chi" },
  { key: "calendar", label: "Lịch sự kiện" },
  { key: "feedback", label: "Phản hồi" },
  { key: "learning", label: "Học" },
  { key: "playbook", label: "Sổ tay chiến lược" },
] as const;

export function InsightsTabs({
  activeTab,
  onTabChange,
}: InsightsTabsProps): React.ReactElement {
  return (
    <nav className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            activeTab === tab.key
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
