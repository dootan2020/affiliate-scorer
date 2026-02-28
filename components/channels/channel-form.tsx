"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ChannelData {
  id?: string;
  name: string;
  handle: string;
  niche: string;
  personaName: string;
  personaDesc: string;
  voiceStyle: string;
  targetAudience: string;
  colorPrimary: string;
  colorSecondary: string;
  fontStyle: string;
  editingStyle: string;
}

interface Props {
  initial?: Partial<ChannelData>;
  onSaved: () => void;
  onCancel: () => void;
}

const VOICE_OPTIONS = [
  { value: "casual", label: "Tự nhiên — giọng Gen Z, thân thiện" },
  { value: "professional", label: "Chuyên nghiệp — giọng tin cậy, rõ ràng" },
  { value: "energetic", label: "Năng động — giọng hào hứng, nhanh" },
  { value: "calm", label: "Nhẹ nhàng — giọng thư giãn, ASMR" },
];

const FONT_OPTIONS = [
  { value: "modern", label: "Hiện đại" },
  { value: "elegant", label: "Sang trọng" },
  { value: "playful", label: "Vui tươi" },
  { value: "minimal", label: "Tối giản" },
];

const EDIT_OPTIONS = [
  { value: "fast_cut", label: "Cắt nhanh — nhịp nhanh, nhiều transition" },
  { value: "smooth", label: "Mượt — chuyển cảnh nhẹ, slow-mo" },
  { value: "cinematic", label: "Cinematic — ánh sáng đẹp, chuyển cảnh mạnh" },
  { value: "minimal", label: "Tối giản — ít hiệu ứng, tập trung SP" },
];

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none";

const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

export function ChannelForm({ initial, onSaved, onCancel }: Props): React.ReactElement {
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelData>({
    name: initial?.name ?? "",
    handle: initial?.handle ?? "",
    niche: initial?.niche ?? "beauty_skincare",
    personaName: initial?.personaName ?? "",
    personaDesc: initial?.personaDesc ?? "",
    voiceStyle: initial?.voiceStyle ?? "casual",
    targetAudience: initial?.targetAudience ?? "Nữ 18-35, quan tâm skincare",
    colorPrimary: initial?.colorPrimary ?? "#E87B35",
    colorSecondary: initial?.colorSecondary ?? "#FFD6B0",
    fontStyle: initial?.fontStyle ?? "modern",
    editingStyle: initial?.editingStyle ?? "fast_cut",
  });

  function update(key: keyof ChannelData, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.name || !form.personaName || !form.personaDesc) return;

    setSaving(true);
    setError(null);
    try {
      const url = isEdit ? `/api/channels/${initial!.id}` : "/api/channels";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        onSaved();
      } else {
        const body = await res.json().catch(() => null);
        setError((body as { error?: string } | null)?.error ?? `Lỗi ${isEdit ? "cập nhật" : "tạo"} kênh (${res.status})`);
      }
    } catch {
      setError("Lỗi kết nối. Thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-5"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        {isEdit ? "Sửa kênh" : "Tạo kênh mới"}
      </h3>

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tên kênh *</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="VD: Chi Lan Beauty"
            required
          />
        </div>
        <div>
          <label className={labelCls}>@Handle TikTok</label>
          <input
            className={inputCls}
            value={form.handle}
            onChange={(e) => update("handle", e.target.value)}
            placeholder="VD: chilanbeauty"
          />
        </div>
      </div>

      {/* Persona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tên nhân vật *</label>
          <input
            className={inputCls}
            value={form.personaName}
            onChange={(e) => update("personaName", e.target.value)}
            placeholder="VD: Chi Lan"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Đối tượng mục tiêu</label>
          <input
            className={inputCls}
            value={form.targetAudience}
            onChange={(e) => update("targetAudience", e.target.value)}
            placeholder="VD: Nữ 18-35, quan tâm skincare"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Mô tả persona *</label>
        <textarea
          className={inputCls + " min-h-[80px] resize-y"}
          value={form.personaDesc}
          onChange={(e) => update("personaDesc", e.target.value)}
          placeholder="VD: Cô gái Gen Z yêu skincare, giọng tự nhiên, hay chia sẻ tips chăm da bình dân..."
          required
        />
      </div>

      {/* Voice & Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Giọng nói / Tone</label>
          <select
            className={inputCls}
            value={form.voiceStyle}
            onChange={(e) => update("voiceStyle", e.target.value)}
          >
            {VOICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Phong cách edit</label>
          <select
            className={inputCls}
            value={form.editingStyle}
            onChange={(e) => update("editingStyle", e.target.value)}
          >
            {EDIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Colors & Font */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Màu chính</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.colorPrimary}
              onChange={(e) => update("colorPrimary", e.target.value)}
              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer"
            />
            <span className="text-xs text-gray-400">{form.colorPrimary}</span>
          </div>
        </div>
        <div>
          <label className={labelCls}>Màu phụ</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.colorSecondary}
              onChange={(e) => update("colorSecondary", e.target.value)}
              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer"
            />
            <span className="text-xs text-gray-400">{form.colorSecondary}</span>
          </div>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Font style</label>
          <select
            className={inputCls}
            value={form.fontStyle}
            onChange={(e) => update("fontStyle", e.target.value)}
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preview</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Kênh <strong>{form.name || "..."}</strong> sẽ tạo content với tone{" "}
          <strong>{VOICE_OPTIONS.find((o) => o.value === form.voiceStyle)?.label.split(" — ")[0]}</strong>,
          style edit{" "}
          <strong>{EDIT_OPTIONS.find((o) => o.value === form.editingStyle)?.label.split(" — ")[0]}</strong>,
          nhắm đến <strong>{form.targetAudience || "..."}</strong>.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
          <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Lưu thay đổi" : "Tạo kênh"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 font-medium transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
