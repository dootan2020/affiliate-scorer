"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface DataPoint {
  weekNumber: number;
  currentAccuracy: number;
}

interface AccuracyChartProps {
  data: DataPoint[];
}

export function AccuracyChart({ data }: AccuracyChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có dữ liệu độ chính xác</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    tuần: `Tuần ${d.weekNumber}`,
    "Độ chính xác": Math.round(d.currentAccuracy * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="tuần"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value: number | undefined) => [`${value ?? 0}%`, "Độ chính xác"]}
          labelStyle={{ color: "#111827" }}
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
            padding: "8px 12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="Độ chính xác"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
