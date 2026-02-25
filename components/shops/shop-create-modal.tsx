"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Star, X, Save } from "lucide-react";

interface ShopCreateModalProps {
  shopName: string;
  platform: string;
  onCreated: (shopId: string) => void;
  onClose: () => void;
}

const SAMPLE_POLICY_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  { value: "sends_free", label: "Gửi free sample" },
  { value: "paid_sample", label: "Mua sample" },
  { value: "no_sample", label: "Không có sample" },
];

function StarInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}): React.ReactElement {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value ?? 0;

  return (
    <div>
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHovered(starValue)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                onChange(value === starValue ? null : starValue);
              }}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  starValue <= displayValue
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-200 dark:text-slate-700"
                } transition-colors`}
              />
            </button>
          );
        })}
        {value !== null && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}

export function ShopCreateModal({
  shopName,
  platform,
  onCreated,
  onClose,
}: ShopCreateModalProps): React.ReactElement {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commissionReliability, setCommissionReliability] = useState<number | null>(null);
  const [supportQuality, setSupportQuality] = useState<number | null>(null);
  const [samplePolicy, setSamplePolicy] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shopName,
          platform,
          commissionReliability,
          supportQuality,
          samplePolicy: samplePolicy || null,
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data.data.id);
      } else {
        const data = await res.json();
        setError(data.error ?? "Lỗi không xác định");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-slate-800/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Danh gia shop
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Shop name (readonly) */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
              Tên shop
            </label>
            <input
              type="text"
              value={shopName}
              readOnly
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>

          {/* Platform (readonly) */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
              Platform
            </label>
            <input
              type="text"
              value={platform}
              readOnly
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
            />
          </div>

          {/* Commission reliability stars */}
          <StarInput
            label="Tra commission dung hen"
            value={commissionReliability}
            onChange={setCommissionReliability}
          />

          {/* Support quality stars */}
          <StarInput
            label="Hỗ trợ affiliate"
            value={supportQuality}
            onChange={setSupportQuality}
          />

          {/* Sample policy */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
              Sample policy
            </label>
            <select
              value={samplePolicy}
              onChange={(e) => setSamplePolicy(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            >
              {SAMPLE_POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-1.5 block">
              Ghi chu
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ghi chú về shop..."
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            Huy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : "Tạo shop"}
          </button>
        </div>
      </div>
    </div>
  );
}
