"use client";

import { useState } from "react";
import { ProductionCreateTab } from "./production-create-tab";
import { ProductionInProgressTab } from "./production-in-progress-tab";
import { ProductionCompletedTab } from "./production-completed-tab";
import { CalendarTab } from "./calendar-tab";
import { TrackingTab } from "./tracking-tab";

type Tab = "in-progress" | "create" | "completed" | "calendar" | "tracking";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "create", label: "Tạo mới" },
  { key: "in-progress", label: "Đang sản xuất" },
  { key: "completed", label: "Đã hoàn thành" },
  { key: "calendar", label: "Lịch đăng" },
  { key: "tracking", label: "Kết quả" },
];

export function ProductionPageClient(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("create");

  return (
    <div className="space-y-6">
      {/* Pill nav */}
      <nav className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 shadow-sm text-gray-900 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === "in-progress" && (
        <ProductionInProgressTab
          onSwitchToCreate={() => setActiveTab("create")}
        />
      )}
      {activeTab === "create" && (
        <ProductionCreateTab
          onBriefsCreated={() => setActiveTab("in-progress")}
        />
      )}
      {activeTab === "completed" && <ProductionCompletedTab />}
      {activeTab === "calendar" && <CalendarTab />}
      {activeTab === "tracking" && <TrackingTab />}
    </div>
  );
}
