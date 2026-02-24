"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CriterionScore {
  score: number;
  weight: number;
  weighted: number;
}

type BreakdownValue = number | CriterionScore;

interface ScoreBreakdownData {
  commission?: BreakdownValue;
  trending?: BreakdownValue;
  competition?: BreakdownValue;
  contentFit?: BreakdownValue;
  price?: BreakdownValue;
  platform?: BreakdownValue;
}

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownData | string | null;
}

const CRITERIA = [
  { key: "commission", label: "Hoa hồng", max: 20, color: "#6366f1" },
  { key: "trending", label: "Xu hướng", max: 20, color: "#f59e0b" },
  { key: "competition", label: "Cạnh tranh", max: 20, color: "#10b981" },
  { key: "contentFit", label: "Nội dung", max: 15, color: "#3b82f6" },
  { key: "price", label: "Giá", max: 15, color: "#ec4899" },
  { key: "platform", label: "Nền tảng", max: 10, color: "#8b5cf6" },
] as const;

function extractScore(val: BreakdownValue | undefined, max: number): number {
  if (val === undefined) return 0;
  if (typeof val === "number") return val;
  return Math.round(val.weighted ?? val.score * (max / 100));
}

function parseBreakdown(breakdown: ScoreBreakdownData | string | null): ScoreBreakdownData {
  if (!breakdown) return {};
  if (typeof breakdown === "string") {
    try {
      return JSON.parse(breakdown) as ScoreBreakdownData;
    } catch {
      return {};
    }
  }
  return breakdown;
}

interface ChartEntry {
  label: string;
  score: number;
  max: number;
  /** Normalized to 0-100 scale for radar display */
  normalized: number;
  display: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartEntry }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-md border border-gray-100 dark:border-slate-700">
      <p className="font-medium text-gray-900 dark:text-gray-50">{entry.label}</p>
      <p className="text-gray-500 dark:text-gray-400">
        {entry.score}/{entry.max} điểm
      </p>
    </div>
  );
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps): React.ReactElement {
  const data = parseBreakdown(breakdown);

  const chartData: ChartEntry[] = CRITERIA.map((c) => {
    const val = extractScore(data[c.key], c.max);
    return {
      label: c.label,
      score: val,
      max: c.max,
      normalized: Math.round((val / c.max) * 100),
      display: `${val}/${c.max}`,
    };
  });

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            dataKey="normalized"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#3b82f6"
            fillOpacity={0.2}
            dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
        {chartData.map((entry, i) => (
          <div key={entry.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CRITERIA[i].color }}
            />
            <span className="text-gray-400 dark:text-gray-500 truncate">{entry.label}:</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">{entry.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
