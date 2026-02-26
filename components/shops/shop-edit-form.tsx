"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Save, ChevronDown, ChevronUp } from "lucide-react";

interface ShopEditFormProps {
  shopId: string;
  initialData: {
    commissionReliability: number | null;
    supportQuality: number | null;
    samplePolicy: string | null;
    notes: string | null;
  };
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
                // Click same star to toggle off
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

export function ShopEditForm({
  shopId,
  initialData,
}: ShopEditFormProps): React.ReactElement {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [commissionReliability, setCommissionReliability] = useState<number | null>(
    initialData.commissionReliability,
  );
  const [supportQuality, setSupportQuality] = useState<number | null>(
    initialData.supportQuality,
  );
  const [samplePolicy, setSamplePolicy] = useState<string>(
    initialData.samplePolicy ?? "",
  );
  const [notes, setNotes] = useState<string>(initialData.notes ?? "");

  async function handleSave(): Promise<void> {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionReliability,
          supportQuality,
          samplePolicy: samplePolicy || null,
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        setToast("Đã lưu thành công!");
        router.refresh();
        setTimeout(() => setToast(null), 3000);
      } else {
        const data = await res.json();
        setToast(`Lỗi: ${data.error ?? "Không xác định"}`);
        setTimeout(() => setToast(null), 5000);
      }
    } catch {
      setToast("Lỗi kết nối. Vui lòng thử lại.");
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
          Chỉnh sửa đánh giá shop
        </p>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-5">
          <StarInput
            label="Trả commission đúng hẹn"
            value={commissionReliability}
            onChange={setCommissionReliability}
          />

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
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
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
              Ghi chú
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ghi chú về shop..."
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none"
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>

            {toast && (
              <span
                className={`text-sm font-medium ${
                  toast.startsWith("Lỗi")
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {toast}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
