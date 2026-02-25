"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface CampaignCreateModalProps {
  productId?: string;
  productName?: string;
  affiliateLink?: string;
  onCreated?: (id: string) => void;
  trigger: React.ReactNode;
}

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "tiktok_shop", label: "TikTok Shop" },
  { value: "shopee", label: "Shopee" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
];

export function CampaignCreateModal({
  productId,
  productName,
  affiliateLink: initialLink,
  onCreated,
  trigger,
}: CampaignCreateModalProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState("tiktok");
  const [name, setName] = useState(
    productName ? `${productName} - TikTok` : ""
  );
  const [plannedBudgetDaily, setPlannedBudgetDaily] = useState("");
  const [plannedDurationDays, setPlannedDurationDays] = useState("7");
  const [affiliateLink, setAffiliateLink] = useState(initialLink ?? "");

  function handlePlatformChange(value: string): void {
    setPlatform(value);
    if (productName) {
      const label = PLATFORMS.find((p) => p.value === value)?.label ?? value;
      setName(`${productName} - ${label}`);
    }
  }

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (next) {
      setError(null);
      setPlatform("tiktok");
      setName(productName ? `${productName} - TikTok` : "");
      setPlannedBudgetDaily("");
      setPlannedDurationDays("7");
      setAffiliateLink(initialLink ?? "");
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body = {
        name: name.trim(),
        platform,
        productId: productId ?? undefined,
        plannedBudgetDaily: plannedBudgetDaily
          ? Number(plannedBudgetDaily)
          : undefined,
        plannedDurationDays: plannedDurationDays
          ? Number(plannedDurationDays)
          : undefined,
        affiliateLink: affiliateLink.trim() || undefined,
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Tạo campaign thất bại");
      }

      const data = (await res.json()) as { id: string };
      setOpen(false);
      onCreated?.(data.id);
      router.push(`/campaigns/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={() => handleOpenChange(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => handleOpenChange(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Tao Campaign moi
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nhập thông tin campaign để bắt đầu chạy sản phẩm
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Ten campaign
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Kem chống nắng - TikTok"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Nen tang
                </label>
                <select
                  value={platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Budget/ngay (VND)
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    type="number"
                    value={plannedBudgetDaily}
                    onChange={(e) => setPlannedBudgetDaily(e.target.value)}
                    placeholder="100000"
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    So ngay chay
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    type="number"
                    value={plannedDurationDays}
                    onChange={(e) => setPlannedDurationDays(e.target.value)}
                    placeholder="7"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Affiliate link
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Huy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
                  disabled={loading || !name.trim()}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tao campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
