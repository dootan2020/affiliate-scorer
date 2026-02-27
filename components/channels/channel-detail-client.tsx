"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChannelForm } from "./channel-form";

interface ChannelData {
  id: string;
  name: string;
  handle: string | null;
  niche: string;
  personaName: string;
  personaDesc: string;
  voiceStyle: string;
  targetAudience: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  fontStyle: string | null;
  editingStyle: string | null;
  isActive: boolean;
  createdAt: string;
}

const VOICE_LABELS: Record<string, string> = {
  casual: "Tự nhiên",
  professional: "Chuyên nghiệp",
  energetic: "Năng động",
  calm: "Nhẹ nhàng",
};

const EDIT_LABELS: Record<string, string> = {
  fast_cut: "Cắt nhanh",
  smooth: "Mượt",
  cinematic: "Cinematic",
  minimal: "Tối giản",
};

const FONT_LABELS: Record<string, string> = {
  modern: "Hiện đại",
  elegant: "Sang trọng",
  playful: "Vui tươi",
  minimal: "Tối giản",
};

interface Props {
  channelId: string;
}

export function ChannelDetailClient({ channelId }: Props): React.ReactElement {
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchChannel = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`/api/channels/${channelId}`);
      if (!res.ok) { setChannel(null); return; }
      const json = (await res.json()) as { data: ChannelData };
      setChannel(json.data);
    } catch {
      setChannel(null);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void fetchChannel();
  }, [fetchChannel]);

  async function handleDelete(): Promise<void> {
    if (!confirm("Xoá kênh này? Hành động không thể hoàn tác.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      if (res.ok) router.push("/channels");
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Không tìm thấy kênh</p>
        <Link href="/channels" className="text-blue-600 hover:underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <Link
          href="/channels"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách kênh
        </Link>
        <ChannelForm
          initial={{
            id: channel.id,
            name: channel.name,
            handle: channel.handle ?? undefined,
            niche: channel.niche,
            personaName: channel.personaName,
            personaDesc: channel.personaDesc,
            voiceStyle: channel.voiceStyle,
            targetAudience: channel.targetAudience ?? undefined,
            colorPrimary: channel.colorPrimary ?? undefined,
            colorSecondary: channel.colorSecondary ?? undefined,
            fontStyle: channel.fontStyle ?? undefined,
            editingStyle: channel.editingStyle ?? undefined,
          }}
          onSaved={() => {
            setEditing(false);
            void fetchChannel();
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/channels"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Danh sách kênh
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: channel.colorPrimary ?? "#3b82f6" }}
            >
              {channel.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                  {channel.name}
                </h2>
                {!channel.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500">
                    Tạm dừng
                  </span>
                )}
              </div>
              {channel.handle && (
                <p className="text-sm text-gray-400 dark:text-gray-500">@{channel.handle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Sửa
            </button>
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Xoá
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoSection title="Persona">
            <InfoRow label="Tên nhân vật" value={channel.personaName} />
            <InfoRow label="Mô tả" value={channel.personaDesc} />
            <InfoRow label="Đối tượng" value={channel.targetAudience ?? "—"} />
          </InfoSection>

          <InfoSection title="Phong cách">
            <InfoRow label="Giọng nói" value={VOICE_LABELS[channel.voiceStyle] ?? channel.voiceStyle} />
            <InfoRow label="Editing" value={EDIT_LABELS[channel.editingStyle ?? ""] ?? channel.editingStyle ?? "—"} />
            <InfoRow label="Font" value={FONT_LABELS[channel.fontStyle ?? ""] ?? channel.fontStyle ?? "—"} />
          </InfoSection>

          <InfoSection title="Màu sắc">
            <div className="flex items-center gap-4">
              {channel.colorPrimary && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-700" style={{ backgroundColor: channel.colorPrimary }} />
                  <span className="text-xs text-gray-500">{channel.colorPrimary}</span>
                </div>
              )}
              {channel.colorSecondary && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-700" style={{ backgroundColor: channel.colorSecondary }} />
                  <span className="text-xs text-gray-500">{channel.colorSecondary}</span>
                </div>
              )}
              {!channel.colorPrimary && !channel.colorSecondary && (
                <span className="text-sm text-gray-400">Chưa cài đặt</span>
              )}
            </div>
          </InfoSection>

          <InfoSection title="Thông tin">
            <InfoRow label="Niche" value={channel.niche} />
            <InfoRow label="Trạng thái" value={channel.isActive ? "Đang hoạt động" : "Tạm dừng"} />
          </InfoSection>
        </div>
      </div>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
