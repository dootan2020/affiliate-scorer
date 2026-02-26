"use client";

import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  label: string;
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
    <nav className="space-y-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={cn(
            "block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
            activeId === item.id
              ? "bg-orange-50 text-orange-700 font-medium dark:bg-orange-950/20 dark:text-orange-400"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800"
          )}
        >
          {item.label}
        </button>
      ))}
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
          {item.label}
        </option>
      ))}
    </select>
  );
}
