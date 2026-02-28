"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ProductionCreateTab } from "./production-create-tab";
import { ProductionInProgressTab } from "./production-in-progress-tab";
import { ProductionCompletedTab } from "./production-completed-tab";
import { CalendarTab } from "./calendar-tab";
import { TrackingTab } from "./tracking-tab";

type Tab = "in-progress" | "create" | "completed" | "calendar" | "tracking";

const TABS: Array<{ key: Tab; label: string; step: number }> = [
  { key: "create", label: "Tạo mới", step: 1 },
  { key: "in-progress", label: "Đang sản xuất", step: 2 },
  { key: "completed", label: "Đã hoàn thành", step: 3 },
  { key: "calendar", label: "Lịch đăng", step: 4 },
  { key: "tracking", label: "Kết quả", step: 5 },
];

export function ProductionPageClient(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId");
  const [activeTab, setActiveTab] = useState<Tab>("create");

  return (
    <div className="space-y-6">
      {/* Pill nav — scrollable on mobile */}
      <nav className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
              activeTab === tab.key
                ? "bg-orange-500 text-white"
                : "bg-gray-300 dark:bg-slate-600 text-white"
            }`}>
              {tab.step}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <ErrorBoundary fallbackTitle="Lỗi hiển thị tab">
        {activeTab === "in-progress" && (
          <ProductionInProgressTab
            onSwitchToCreate={() => setActiveTab("create")}
          />
        )}
        {activeTab === "create" && (
          <ProductionCreateTab
            onBriefsCreated={() => setActiveTab("in-progress")}
            initialProductId={initialProductId}
          />
        )}
        {activeTab === "completed" && <ProductionCompletedTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "tracking" && <TrackingTab />}
      </ErrorBoundary>
    </div>
  );
}
