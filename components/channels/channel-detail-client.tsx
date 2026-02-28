"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
  // New fields
  subNiche: string | null;
  usp: string | null;
  contentPillars: string[] | null;
  hookBank: string[] | null;
  contentMix: Record<string, number> | null;
  postsPerDay: number | null;
  postingSchedule: Record<string, { times: string[]; focus: string }> | null;
  seriesSchedule: Array<{ name: string; dayOfWeek: string; contentPillar: string }> | null;
  ctaTemplates: Record<string, string> | null;
  competitorChannels: Array<{ handle: string; followers: string; whyReference: string }> | null;
  generatedByAi: boolean;
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

const MIX_LABELS: Record<string, string> = {
  entertainment: "Giải trí",
  education: "Giáo dục",
  review: "Review",
  selling: "Bán hàng",
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
  const [error, setError] = useState<string | null>(null);

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

  async function handleToggleActive(): Promise<void> {
    if (!channel) return;
    const newActive = !channel.isActive;
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (res.ok) {
        setChannel({ ...channel, isActive: newActive });
        toast.success(newActive ? "Kênh đã kích hoạt" : "Kênh đã tạm dừng");
      } else {
        toast.error("Không thể cập nhật trạng thái kênh");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  async function handleDelete(): Promise<void> {
    if (!confirm("Xoá kênh này? Hành động không thể hoàn tác.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/channels");
      } else {
        setError("Không thể xoá kênh. Thử lại.");
      }
    } catch {
      setError("Lỗi kết nối khi xoá kênh");
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
            handle: channel.handle,
            niche: channel.niche,
            personaName: channel.personaName,
            personaDesc: channel.personaDesc,
            voiceStyle: channel.voiceStyle,
            targetAudience: channel.targetAudience,
            colorPrimary: channel.colorPrimary,
            colorSecondary: channel.colorSecondary,
            fontStyle: channel.fontStyle,
            editingStyle: channel.editingStyle,
            subNiche: channel.subNiche,
            usp: channel.usp,
            contentPillars: channel.contentPillars,
            hookBank: channel.hookBank,
            contentMix: channel.contentMix,
            postsPerDay: channel.postsPerDay,
            postingSchedule: channel.postingSchedule,
            seriesSchedule: channel.seriesSchedule,
            ctaTemplates: channel.ctaTemplates,
            competitorChannels: channel.competitorChannels,
            generatedByAi: channel.generatedByAi,
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

  const pillars = channel.contentPillars ?? [];
  const hooks = channel.hookBank ?? [];
  const mix = channel.contentMix;
  const schedule = channel.postingSchedule;
  const series = channel.seriesSchedule ?? [];
  const cta = channel.ctaTemplates;
  const competitors = channel.competitorChannels ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/channels"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Danh sách kênh
      </Link>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
          <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 text-xs">x</button>
        </div>
      )}

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
                {channel.generatedByAi && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-3 h-3" /> Tạo bởi AI
                  </span>
                )}
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
              onClick={() => void handleToggleActive()}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                channel.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"
              }`}
              title={channel.isActive ? "Tạm dừng kênh" : "Kích hoạt kênh"}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  channel.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
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

        {/* Info grid — existing fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InfoSection title="Persona">
            <InfoRow label="Tên nhân vật" value={channel.personaName} />
            <InfoRow label="Mô tả" value={channel.personaDesc} />
            <InfoRow label="Đối tượng" value={channel.targetAudience ?? "—"} />
            {channel.subNiche && <InfoRow label="Sub-niche" value={channel.subNiche} />}
            {channel.usp && <InfoRow label="USP" value={channel.usp} />}
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

        {/* New expert fields */}

        {/* Content Pillars */}
        {pillars.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mb-6">
            <InfoSection title="Content Pillars">
              <div className="flex flex-wrap gap-2">
                {pillars.map((p, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                    {p}
                  </span>
                ))}
              </div>
            </InfoSection>
          </div>
        )}

        {/* Hook Bank */}
        {hooks.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mb-6">
            <InfoSection title={`Hook Bank (${hooks.length})`}>
              <ol className="space-y-1">
                {hooks.map((h, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}.</span>
                    {h}
                  </li>
                ))}
              </ol>
            </InfoSection>
          </div>
        )}

        {/* Content Mix */}
        {mix && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mb-6">
            <InfoSection title="Content Mix">
              <div className="space-y-2">
                {Object.entries(mix).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">{MIX_LABELS[key] ?? key}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 text-right">{val}%</span>
                  </div>
                ))}
              </div>
            </InfoSection>
          </div>
        )}

        {/* Posting Schedule */}
        {(channel.postsPerDay || schedule) && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mb-6">
            <InfoSection title="Lịch đăng">
              {channel.postsPerDay && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>{channel.postsPerDay}</strong> post/ngày
                </p>
              )}
              {schedule && (
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(schedule).map(([day, s]) => (
                    <div key={day} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">{day}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{s.times?.join(", ")}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.focus}</p>
                    </div>
                  ))}
                </div>
              )}
            </InfoSection>
          </div>
        )}

        {/* Series Schedule */}
        {series.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mb-6">
            <InfoSection title="Series Schedule">
              <div className="space-y-2">
                {series.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-xs text-gray-500">{s.dayOfWeek}</span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                      {s.contentPillar}
                    </span>
                  </div>
                ))}
              </div>
            </InfoSection>
          </div>
        )}

        {/* CTA Templates */}
        {cta && Object.values(cta).some(Boolean) && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-6 mb-6">
            <InfoSection title="CTA Templates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(cta).map(([key, val]) => val ? (
                  <div key={key} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">{MIX_LABELS[key] ?? key}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{val}</p>
                  </div>
                ) : null)}
              </div>
            </InfoSection>
          </div>
        )}

        {/* Competitor Channels */}
        {competitors.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
            <InfoSection title="Kênh tham khảo">
              <div className="space-y-2">
                {competitors.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{c.handle}</span>
                    <span className="text-xs text-gray-400">({c.followers})</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-600 dark:text-gray-400">{c.whyReference}</span>
                  </div>
                ))}
              </div>
            </InfoSection>
          </div>
        )}
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
