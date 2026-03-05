"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PipelineStepper } from "@/components/shared/pipeline-stepper";
import { AnimatedTabContent } from "@/components/shared/animated-tab-content";
import { ProductionCreateTab } from "./production-create-tab";
import { ProductionInProgressTab } from "./production-in-progress-tab";
import { ProductionCompletedTab } from "./production-completed-tab";
import { CalendarTab } from "./calendar-tab";
import { TrackingTab } from "./tracking-tab";

type Tab = "in-progress" | "create" | "completed" | "calendar" | "tracking";

const PIPELINE_STEPS = [
  { key: "create" as Tab, label: "Tạo mới" },
  { key: "in-progress" as Tab, label: "Đang sản xuất" },
  { key: "completed" as Tab, label: "Đã hoàn thành" },
  { key: "calendar" as Tab, label: "Lịch đăng" },
  { key: "tracking" as Tab, label: "Kết quả" },
];

export function ProductionPageClient(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId");
  const initialChannelId = searchParams.get("channel");
  const [activeTab, setActiveTab] = useState<Tab>(initialProductId ? "create" : "in-progress");

  return (
    <div className="space-y-6">
      {/* Pipeline stepper */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4">
        <PipelineStepper
          steps={PIPELINE_STEPS}
          activeStep={activeTab}
          onStepChange={(key) => setActiveTab(key as Tab)}
        />
      </div>

      {/* Tab content */}
      <ErrorBoundary fallbackTitle="Lỗi hiển thị tab">
        <AnimatedTabContent tabKey={activeTab}>
          {activeTab === "in-progress" && (
            <ProductionInProgressTab
              onSwitchToCreate={() => setActiveTab("create")}
            />
          )}
          {activeTab === "create" && (
            <ProductionCreateTab
              onBriefsCreated={() => setActiveTab("in-progress")}
              initialProductId={initialProductId}
              initialChannelId={initialChannelId}
            />
          )}
          {activeTab === "completed" && <ProductionCompletedTab />}
          {activeTab === "calendar" && <CalendarTab />}
          {activeTab === "tracking" && <TrackingTab />}
        </AnimatedTabContent>
      </ErrorBoundary>
    </div>
  );
}
