"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Key,
  Tv,
  Upload,
  Star,
  FileText,
  Video,
  BookOpen,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStep } from "./guide-onboarding-steps";
import { STORAGE_KEY } from "./guide-onboarding-steps";

const STEPS: OnboardingStep[] = [
  {
    id: "api-key",
    icon: <Key className="w-4 h-4" />,
    title: "Kết nối khóa API",
    description: "Nhập API key từ Anthropic, OpenAI hoặc Google để kích hoạt AI.",
    href: "/settings",
    linkLabel: "Mở Cài đặt",
    time: "2 phút",
    tip: "Chọn preset \"Tiết kiệm\" nếu muốn chi phí thấp nhất.",
  },
  {
    id: "channel",
    icon: <Tv className="w-4 h-4" />,
    title: "Tạo kênh TikTok",
    description: "Tạo kênh để AI hiểu phong cách và ngách của bạn.",
    href: "/channels",
    linkLabel: "Mở Kênh TikTok",
    time: "3 phút",
    tip: "Dùng Niche Finder nếu chưa biết chọn ngách nào.",
  },
  {
    id: "import",
    icon: <Upload className="w-4 h-4" />,
    title: "Import sản phẩm từ FastMoss",
    description: "Upload file .xlsx từ FastMoss — hệ thống tự nhận dạng cột và import.",
    href: "/sync",
    linkLabel: "Mở Đồng bộ",
    time: "1 phút",
  },
  {
    id: "score",
    icon: <Star className="w-4 h-4" />,
    title: "Chọn sản phẩm điểm cao",
    description: "Xem Inbox, ưu tiên SP có điểm 70+ — đây là vùng lý tưởng để bắt đầu.",
    href: "/inbox",
    linkLabel: "Mở Hộp SP",
    time: "2 phút",
  },
  {
    id: "brief",
    icon: <FileText className="w-4 h-4" />,
    title: "Tạo Brief nội dung",
    description: "Chọn SP → Tạo Brief AI → nhận 5 góc quay, 10 hook, 3 script sẵn sàng.",
    href: "/production",
    linkLabel: "Mở Sản xuất",
    time: "1 phút",
  },
  {
    id: "record",
    icon: <Video className="w-4 h-4" />,
    title: "Quay video & đăng TikTok",
    description: "Copy script từ brief → quay video → đăng lên TikTok Shop.",
    href: "/production",
    linkLabel: "Xem Brief",
    time: "15-30 phút",
  },
  {
    id: "log",
    icon: <BookOpen className="w-4 h-4" />,
    title: "Log kết quả",
    description: "Dán link video TikTok + ghi views, đơn hàng. AI học từ dữ liệu này!",
    href: "/log",
    linkLabel: "Mở Nhật ký",
    time: "1 phút",
  },
];

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch { /* storage unavailable */ }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
}

export function GuideOnboardingChecklist(): React.ReactElement {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = safeGetItem(STORAGE_KEY);
    if (stored) {
      try {
        setCompleted(new Set(JSON.parse(stored) as string[]));
      } catch { /* ignore invalid data */ }
    }
    setMounted(true);
  }, []);

  function toggleStep(id: string): void {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      safeSetItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function handleReset(): void {
    setCompleted(new Set());
    safeRemoveItem(STORAGE_KEY);
  }

  const completedCount = completed.size;
  const totalSteps = STEPS.length;
  const allDone = completedCount === totalSteps;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const nextStepId = STEPS.find((s) => !completed.has(s.id))?.id;

  if (!mounted) return <></>;

  return (
    <div className="not-prose mb-10 rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-gradient-to-b from-orange-50/80 to-white dark:from-orange-950/20 dark:to-slate-900 overflow-hidden">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
            {allDone ? (
              <Check className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            ) : (
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {completedCount}/{totalSteps}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              {allDone ? "Hoàn thành! Bạn đã sẵn sàng" : "Bắt đầu với PASTR"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {allDone
                ? "Tất cả bước đã hoàn thành — tiếp tục sản xuất hàng ngày!"
                : `${completedCount}/${totalSteps} bước — ước tính tổng ~25 phút`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedCount > 0 && !allDone && (
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              {progress}%
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {!allDone && (
        <div className="px-5 pb-1">
          <div className="h-1 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="px-5 pb-5 pt-3 space-y-2">
          {STEPS.map((step) => {
            const isDone = completed.has(step.id);
            const isNext = !isDone && step.id === nextStepId;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
                  isNext && "bg-orange-50/80 dark:bg-orange-950/20 ring-1 ring-orange-200 dark:ring-orange-800/50",
                  isDone && "opacity-60",
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={step.title}
                  onClick={() => toggleStep(step.id)}
                  className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                    isDone
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-gray-300 dark:border-slate-600 hover:border-orange-400",
                  )}
                >
                  {isDone && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-sm font-medium",
                      isDone
                        ? "text-gray-500 dark:text-gray-400 line-through"
                        : "text-gray-900 dark:text-gray-50",
                    )}>
                      {step.title}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      ~{step.time}
                    </span>
                  </div>
                  {!isDone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                  {!isDone && step.tip && (
                    <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-1">
                      💡 {step.tip}
                    </p>
                  )}
                  {!isDone && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                    >
                      {step.icon}
                      {step.linkLabel} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {completedCount > 0 && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
