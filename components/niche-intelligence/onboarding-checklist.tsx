"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Key,
  Package,
  FileText,
  Rocket,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingData {
  hasOnboarding: boolean;
  channelId?: string;
  niche?: string;
  steps?: {
    apiKeys: boolean;
    syncProducts: boolean;
    generateBrief: boolean;
  };
}

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  done: boolean;
}

export function OnboardingChecklist(): React.ReactElement | null {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissal
    if (typeof window !== "undefined" && localStorage.getItem("pastr-onboarding-dismissed")) {
      setDismissed(true);
      return;
    }

    fetch("/api/niche-intelligence/onboarding-status")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ hasOnboarding: false }));
  }, []);

  if (dismissed || !data?.hasOnboarding || !data.steps) return null;

  const steps: OnboardingStep[] = [
    {
      key: "apiKeys",
      label: "Kết nối API key",
      description: "Cấu hình AI provider để sử dụng các tính năng AI",
      href: "/settings",
      icon: <Key className="w-4 h-4" />,
      done: data.steps.apiKeys,
    },
    {
      key: "syncProducts",
      label: "Đồng bộ sản phẩm",
      description: "Import sản phẩm từ TikTok Shop để bắt đầu",
      href: "/sync",
      icon: <Package className="w-4 h-4" />,
      done: data.steps.syncProducts,
    },
    {
      key: "generateBrief",
      label: "Tạo content brief",
      description: "AI tạo kịch bản video từ sản phẩm của bạn",
      href: data.channelId ? `/channels/${data.channelId}` : "/channels",
      icon: <FileText className="w-4 h-4" />,
      done: data.steps.generateBrief,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  const handleDismiss = (): void => {
    setDismissed(true);
    localStorage.setItem("pastr-onboarding-dismissed", "1");
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Bắt đầu với ngách của bạn
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {doneCount}/{steps.length} bước hoàn thành
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Ẩn checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-colors",
              step.done
                ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                step.done
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-400"
              )}
            >
              {step.done ? <Check className="w-3.5 h-3.5" /> : step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.done
                    ? "text-emerald-700 dark:text-emerald-400 line-through"
                    : "text-gray-900 dark:text-gray-50"
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {step.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {allDone && (
        <div className="mt-4 text-center">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            Tuyệt vời! Bạn đã sẵn sàng bắt đầu!
          </p>
        </div>
      )}
    </div>
  );
}
