"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeightMap } from "@/lib/ai/prompts";

interface WeeklyReportProps {
  currentAccuracy: number;
  previousAccuracy: number;
  insights: string;
  weightsBefore: WeightMap;
  weightsAfter: WeightMap;
  weekNumber: number;
}

function AccuracyTrend({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const diff = current - previous;
  const pct = Math.round(diff * 100);
  const currentPct = Math.round(current * 100);

  if (Math.abs(diff) < 0.005) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Minus className="h-5 w-5" />
        <span className="text-2xl font-bold">{currentPct}%</span>
        <span className="text-sm">Không thay đổi</span>
      </div>
    );
  }

  if (diff > 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <TrendingUp className="h-5 w-5" />
        <span className="text-2xl font-bold">{currentPct}%</span>
        <span className="text-sm">+{pct}% so với tuần trước</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-rose-600">
      <TrendingDown className="h-5 w-5" />
      <span className="text-2xl font-bold">{currentPct}%</span>
      <span className="text-sm">{pct}% so với tuần trước</span>
    </div>
  );
}

function formatWeight(value: number): string {
  return (value * 100).toFixed(0) + "%";
}

const WEIGHT_LABELS: Record<keyof WeightMap, string> = {
  commission: "Hoa hồng",
  trending: "Xu hướng",
  competition: "Cạnh tranh",
  contentFit: "Phù hợp nội dung",
  price: "Giá",
  platform: "Platform",
};

export function WeeklyReport({
  currentAccuracy,
  previousAccuracy,
  insights,
  weightsBefore,
  weightsAfter,
  weekNumber,
}: WeeklyReportProps) {
  const changedWeights = (Object.keys(weightsBefore) as (keyof WeightMap)[]).filter(
    (key) => Math.abs(weightsAfter[key] - weightsBefore[key]) >= 0.005
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Độ chính xác — Tuần {weekNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccuracyTrend current={currentAccuracy} previous={previousAccuracy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Thay đổi trọng số
          </CardTitle>
        </CardHeader>
        <CardContent>
          {changedWeights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có thay đổi trọng số</p>
          ) : (
            <ul className="space-y-1">
              {changedWeights.map((key) => {
                const diff = weightsAfter[key] - weightsBefore[key];
                return (
                  <li key={key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{WEIGHT_LABELS[key]}</span>
                    <span className="font-medium">
                      {formatWeight(weightsBefore[key])} →{" "}
                      <span className={diff > 0 ? "text-emerald-600" : "text-rose-600"}>
                        {formatWeight(weightsAfter[key])}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Chiến lược đề xuất
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{insights}</p>
        </CardContent>
      </Card>
    </div>
  );
}
