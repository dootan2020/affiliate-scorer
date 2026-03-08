"use client";

import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  label: string;
  indent?: boolean;
}

interface GuideTocProps {
  items: TocItem[];
  activeId: string;
}

export function GuideToc({ items, activeId }: GuideTocProps): React.ReactElement {
  function handleClick(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="space-y-px">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              "group relative block w-full text-left py-1.5 pr-3 transition-colors rounded-r-lg",
              item.indent ? "pl-7 text-[13px]" : "pl-3 text-[13px] font-medium",
              isActive
                ? "text-orange-700 bg-orange-50/80 dark:text-orange-400 dark:bg-orange-950/20"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800/80",
            )}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-orange-500 dark:bg-orange-400" />
            )}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

interface GuideTocMobileProps {
  items: TocItem[];
  activeId: string;
}

export function GuideTocMobile({ items, activeId }: GuideTocMobileProps): React.ReactElement {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const el = document.getElementById(e.target.value);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <select
      value={activeId}
      onChange={handleChange}
      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none mb-6"
    >
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.indent ? "  " : ""}{item.label}
        </option>
      ))}
    </select>
  );
}
