"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pastr-sidebar-collapsed";

/** Listens for sidebar collapse state changes and adjusts left margin accordingly. */
export function SidebarAwareMain({ children }: { children: React.ReactNode }): React.ReactElement {
  const [collapsed, setCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    // Read initial state from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    setCollapsed(stored === "true");

    function handleSidebarToggle(e: Event): void {
      const custom = e as CustomEvent<boolean>;
      setCollapsed(custom.detail);
    }

    window.addEventListener("sidebar-collapsed-change", handleSidebarToggle);
    return () => window.removeEventListener("sidebar-collapsed-change", handleSidebarToggle);
  }, []);

  // collapsed === null means SSR/hydration — use default (expanded = ml-60)
  const marginClass =
    collapsed === null
      ? "md:ml-60"
      : collapsed
      ? "md:ml-16"
      : "md:ml-60";

  return (
    <main
      className={`flex-1 overflow-auto pt-14 pb-20 md:pt-0 md:pb-0 transition-[margin] duration-200 ${marginClass}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
    </main>
  );
}
