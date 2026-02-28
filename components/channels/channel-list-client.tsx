"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Tv, Loader2 } from "lucide-react";
import { ChannelForm } from "./channel-form";

interface ChannelSummary {
  id: string;
  name: string;
  handle: string | null;
  niche: string;
  personaName: string;
  voiceStyle: string;
  isActive: boolean;
  colorPrimary: string | null;
}

const VOICE_LABELS: Record<string, string> = {
  casual: "Tự nhiên",
  professional: "Chuyên nghiệp",
  energetic: "Năng động",
  calm: "Nhẹ nhàng",
};

export function ChannelListClient(): React.ReactElement {
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchChannels(): Promise<void> {
    setError(null);
    try {
      const res = await fetch("/api/channels");
      if (!res.ok) {
        setError(`Lỗi tải kênh (${res.status})`);
        return;
      }
      const json = (await res.json()) as { data: ChannelSummary[] };
      setChannels(json.data ?? []);
    } catch {
      setError("Không thể tải danh sách kênh. Kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchChannels();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (channels.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Tv className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có kênh nào
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Tạo kênh TikTok đầu tiên với persona, style guide để bắt đầu sản xuất content
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
        >
          Tạo kênh đầu tiên
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
          <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 text-xs">✕</button>
        </div>
      )}
      {showForm && (
        <ChannelForm
          onSaved={() => {
            setShowForm(false);
            void fetchChannels();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm kênh
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((ch) => (
          <Link
            key={ch.id}
            href={`/channels/${ch.id}`}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow block"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: ch.colorPrimary ?? "#3b82f6" }}
              >
                {ch.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                    {ch.name}
                  </h3>
                  {!ch.isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">
                      Tạm dừng
                    </span>
                  )}
                </div>
                {ch.handle && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">@{ch.handle}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {ch.personaName} · {VOICE_LABELS[ch.voiceStyle] ?? ch.voiceStyle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
