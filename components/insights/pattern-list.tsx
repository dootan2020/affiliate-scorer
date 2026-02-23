"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  Commission: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Trending: "bg-orange-100 text-orange-700 border-orange-200",
  Price: "bg-purple-100 text-purple-700 border-purple-200",
  Content: "bg-blue-100 text-blue-700 border-blue-200",
  Platform: "bg-pink-100 text-pink-700 border-pink-200",
  General: "bg-gray-100 text-gray-700 border-gray-200",
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
      <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">
        Chưa có patterns được phát hiện
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {patterns.map((pattern, idx) => {
        const category = detectCategory(pattern);
        return (
          <Card key={idx} className="border border-border/60">
            <CardContent className="flex items-start gap-3 py-3 px-4">
              <Badge
                variant="outline"
                className={`shrink-0 text-xs font-medium ${CATEGORY_COLORS[category]}`}
              >
                {category}
              </Badge>
              <p className="text-sm text-foreground leading-relaxed">{pattern}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
