"use client";

import { Layers } from "lucide-react";

interface PatternListProps {
  patterns: string[];
}

type PatternCategory =
  | "Commission"
  | "Trending"
  | "Price"
  | "Content"
  | "Platform"
  | "General";

const CATEGORY_KEYWORDS: Record<PatternCategory, string[]> = {
  Commission: ["hoa hồng", "commission", "doanh thu", "lợi nhuận"],
  Trending: ["trending", "xu hướng", "tăng trưởng", "viral", "hot"],
  Price: ["giá", "price", "phân khúc", "tầm giá"],
  Content: ["nội dung", "content", "video", "review", "hook"],
  Platform: ["platform", "tiktok", "shopee", "lazada", "facebook", "instagram"],
  General: [],
};

const CATEGORY_COLORS: Record<PatternCategory, string> = {
  Commission: "bg-emerald-50 text-emerald-700",
  Trending: "bg-orange-50 text-orange-700",
  Price: "bg-purple-50 text-purple-700",
  Content: "bg-blue-50 text-blue-700",
  Platform: "bg-pink-50 text-pink-700",
  General: "bg-gray-100 text-gray-600",
};

function detectCategory(pattern: string): PatternCategory {
  const lower = pattern.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    PatternCategory,
    string[],
  ][]) {
    if (cat === "General") continue;
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "General";
}

export function PatternList({ patterns }: PatternListProps) {
  if (patterns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Chưa có patterns được phát hiện</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {patterns.map((pattern, idx) => {
        const category = detectCategory(pattern);
        return (
          <div key={idx} className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3">
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLORS[category]}`}
            >
              {category}
            </span>
            <p className="text-sm text-gray-600 leading-relaxed">{pattern}</p>
          </div>
        );
      })}
    </div>
  );
}
