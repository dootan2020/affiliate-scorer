"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface QuickEnrichModalProps {
  identityId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface IdentityData {
  title: string;
  shopName: string;
  category: string;
  price: string;
  commissionRate: string;
  personalNotes: string;
}

const CATEGORIES = [
  "", "Làm đẹp", "Sức khỏe", "Thời trang", "Gia dụng", "Điện tử",
  "Thực phẩm", "Mẹ & Bé", "Thú cưng", "Thể thao", "Phụ kiện", "Khác",
];

export function QuickEnrichModal({ identityId, onClose, onSaved }: QuickEnrichModalProps): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<IdentityData>({
    title: "",
    shopName: "",
    category: "",
    price: "",
    commissionRate: "",
    personalNotes: "",
  });

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/inbox/${identityId}`);
        const json = await res.json();
        if (res.ok && json.data) {
          const d = json.data;
          setForm({
            title: d.title || "",
            shopName: d.shopName || "",
            category: d.category || "",
            price: d.price ? String(d.price) : "",
            commissionRate: d.commissionRate ? String(parseFloat(d.commissionRate)) : "",
            personalNotes: d.personalNotes || "",
          });
        }
      } catch (e) {
        console.error("[quick-enrich-modal]", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [identityId]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (form.title) body.title = form.title;
      if (form.shopName) body.shopName = form.shopName;
      if (form.category) body.category = form.category;
      if (form.price) body.price = parseInt(form.price, 10);
      if (form.commissionRate) body.commissionRate = parseFloat(form.commissionRate);
      if (form.personalNotes) body.personalNotes = form.personalNotes;

      const res = await fetch(`/api/inbox/${identityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Đã lưu thông tin");
        onSaved();
      } else {
        const json = await res.json();
        toast.error(json.error || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Không thể kết nối server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon-sm"
          className="absolute top-4 right-4"
        >
          <X className="w-4 h-4 text-gray-400" />
        </Button>

        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Thêm thông tin nhanh
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
          Tất cả trường đều không bắt buộc. Bỏ qua được.
        </p>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
              <div className="h-10 w-full bg-gray-100 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
                <div className="h-10 w-full bg-gray-100 dark:bg-slate-800 rounded-xl" />
              </div>
              <div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
                <div className="h-10 w-full bg-gray-100 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
            <div>
              <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
              <div className="h-10 w-full bg-gray-100 dark:bg-slate-800 rounded-xl" />
            </div>
            <div>
              <div className="h-3 w-14 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
              <div className="h-16 w-full bg-gray-100 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tên sản phẩm
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: Serum Vitamin C 65g"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Giá (VNĐ)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="129000"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  placeholder="15"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Danh mục
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
              >
                <option value="">Chọn hoặc bỏ qua</option>
                {CATEGORIES.filter(Boolean).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Ghi chú
              </label>
              <textarea
                value={form.personalNotes}
                onChange={(e) => setForm({ ...form, personalNotes: e.target.value })}
                placeholder="VD: Thấy trên FYP đang viral"
                rows={2}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                Bỏ qua
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
