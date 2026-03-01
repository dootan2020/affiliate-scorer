"use client";

import { useState, useEffect } from "react";
import { Tv, Calendar, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

interface ChannelTask {
  channelId: string;
  channelName: string;
  personaName: string;
  slotsToday: number;
  needsBrief: number;
  drafts: number;
  readyToPublish: number;
  publishedToday: number;
}

export function ChannelTaskBoard(): React.ReactElement {
  const [tasks, setTasks] = useState<ChannelTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/channel-tasks")
      .then((r) => r.json())
      .then((json: { data?: ChannelTask[] }) => setTasks(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tv className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Kênh hôm nay</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tv className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Kênh hôm nay</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Tv className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Chưa có kênh nào</p>
          <Link
            href="/channels"
            className="text-sm text-blue-600 hover:underline"
          >
            Tạo kênh mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tv className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Kênh hôm nay</h2>
        <span className="text-xs text-gray-400 ml-auto">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <ChannelCard key={task.channelId} task={task} />
        ))}
      </div>
    </div>
  );
}

function ChannelCard({ task }: { task: ChannelTask }): React.ReactElement {
  const totalSlots = task.slotsToday;
  const completed = task.publishedToday;
  const progressPct = totalSlots > 0 ? Math.round((completed / totalSlots) * 100) : 0;

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
          {task.channelName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{task.channelName}</p>
          <p className="text-xs text-gray-400 truncate">{task.personaName}</p>
        </div>
      </div>

      {/* Slot stats */}
      {totalSlots > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Slots hôm nay</span>
            <span>{completed}/{totalSlots}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricBadge label="Cần brief" value={task.needsBrief} color="amber" />
        <MetricBadge label="Nháp" value={task.drafts} color="blue" />
        <MetricBadge label="Sẵn đăng" value={task.readyToPublish} color="emerald" />
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Link
          href={`/production?channel=${task.channelId}`}
          className="flex-1 flex items-center justify-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Tạo Brief
        </Link>
        <Link
          href={`/channels/${task.channelId}`}
          className="flex-1 flex items-center justify-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Calendar className="w-3 h-3" />
          Lịch
        </Link>
      </div>
    </div>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: number; color: string }): React.ReactElement {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
    blue: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <div className={`rounded-lg px-2 py-1.5 text-center ${colorMap[color] || colorMap.blue}`}>
      <p className="text-base font-semibold">{value}</p>
      <p className="text-[10px] leading-tight">{label}</p>
    </div>
  );
}
