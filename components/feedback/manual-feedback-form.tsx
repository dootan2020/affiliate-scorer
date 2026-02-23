"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PenLine } from "lucide-react";

interface ManualFeedbackFormProps {
  products: Array<{ id: string; name: string }>;
}

export function ManualFeedbackForm({
  products,
}: ManualFeedbackFormProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState("");
  const [result, setResult] = useState<"success" | "moderate" | "poor">("moderate");
  const [adSpend, setAdSpend] = useState("");
  const [revenue, setRevenue] = useState("");
  const [orders, setOrders] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!productId) {
      toast.error("Chọn sản phẩm");
      return;
    }

    setSaving(true);
    try {
      const spend = parseFloat(adSpend) || null;
      const rev = parseFloat(revenue) || null;
      const ord = parseInt(orders) || null;
      const roas = spend && rev ? rev / spend : null;

      const res = await fetch("/api/feedback/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          overallSuccess: result,
          adSpend: spend,
          adROAS: roas,
          revenue: rev,
          orders: ord,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Đã lưu feedback");
      setProductId("");
      setResult("moderate");
      setAdSpend("");
      setRevenue("");
      setOrders("");
      setNotes("");
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu feedback");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
      >
        <PenLine className="w-4 h-4" />
        Nhập kết quả thủ công
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">
          Nhập kết quả thủ công
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Đóng
        </button>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Sản phẩm *
        </label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        >
          <option value="">Chọn sản phẩm...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Kết quả *
        </label>
        <div className="flex gap-2">
          {(["success", "moderate", "poor"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setResult(opt)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                result === opt
                  ? opt === "success"
                    ? "bg-emerald-500 text-white"
                    : opt === "moderate"
                      ? "bg-amber-500 text-white"
                      : "bg-red-500 text-white"
                  : "bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {opt === "success" ? "✅ Tốt" : opt === "moderate" ? "⚡ TB" : "❌ Kém"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Chi tiêu (VND)
          </label>
          <input
            type="number"
            value={adSpend}
            onChange={(e) => setAdSpend(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Doanh thu (VND)
          </label>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Đơn hàng
          </label>
          <input
            type="number"
            value={orders}
            onChange={(e) => setOrders(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Ghi chú
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ghi chú thêm (tuỳ chọn)"
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !productId}
        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Đang lưu..." : "Lưu feedback"}
      </button>
    </form>
  );
}
