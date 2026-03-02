"use client";

import { cn } from "@/lib/utils";

export interface PillTab {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface PillTabsProps {
  tabs: PillTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function PillTabs({ tabs, activeTab, onTabChange, className }: PillTabsProps): React.ReactElement {
  return (
    <div className={cn(
      "flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none",
      className,
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
            activeTab === tab.value
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50",
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count != null && tab.count > 0 && (
            <span className="text-xs bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
