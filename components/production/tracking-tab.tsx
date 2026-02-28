"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Trophy,
  Upload,
  Plus,
  X,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface TrackingEntry {
  id: string;
  contentAssetId: string;
  tiktokVideoUrl: string | null;
  publishedAt: string | null;
  views24h: number | null;
  views7d: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicksToShop: number | null;
  orders: number | null;
  revenue: number | null;
  commission: number | null;
  isWinner: boolean;
  winReason: string | null;
  contentAsset: {
    id: string;
    assetCode: string | null;
    format: string | null;
    contentType: string | null;
    videoFormat: string | null;
    hookText: string | null;
    productIdentity: { id: string; title: string | null; imageUrl: string | null } | null;
  };
}

interface UnpublishedAsset {
  id: string;
  assetCode: string | null;
  format: string | null;
  hookText: string | null;
  productIdentity: { title: string | null } | null;
}

const FORMAT_LABELS: Record<string, string> = {
  before_after: "B/A",
  product_showcase: "Showcase",
  slideshow_voiceover: "Slide+VO",
  tutorial_steps: "Tutorial",
  comparison: "Compare",
  trending_hook: "Trending",
};

const inputCls =
  "rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none";

function formatNum(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("vi-VN");
}

function formatVND(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("vi-VN") + "đ";
}

export function TrackingTab(): React.ReactElement {
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<UnpublishedAsset[]>([]);

  // Form state
  const [formAssetId, setFormAssetId] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formViews, setFormViews] = useState("");
  const [formLikes, setFormLikes] = useState("");
  const [formComments, setFormComments] = useState("");
  const [formShares, setFormShares] = useState("");
  const [formOrders, setFormOrders] = useState("");
  const [formRevenue, setFormRevenue] = useState("");
  const [formCommission, setFormCommission] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTracking = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tracking");
      if (!res.ok) {
        setError(`Lỗi tải kết quả (${res.status})`);
        setEntries([]);
        return;
      }
      const json = (await res.json()) as { data?: TrackingEntry[] };
      setEntries(json.data ?? []);
    } catch {
      setError("Không thể tải kết quả. Kiểm tra kết nối mạng.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssets = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/assets?status=draft,produced,rendered,published&limit=50");
      if (!res.ok) return;
      const json = (await res.json()) as { data?: UnpublishedAsset[] };
      setAssets(json.data ?? []);
    } catch {
      toast.error("Không thể tải danh sách video");
    }
  }, []);

  useEffect(() => {
    void fetchTracking();
    void fetchAssets();
  }, [fetchTracking, fetchAssets]);

  async function handleSubmit(): Promise<void> {
    if (!formAssetId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentAssetId: formAssetId,
          tiktokVideoUrl: formUrl || undefined,
          views24h: formViews ? parseInt(formViews, 10) : undefined,
          likes: formLikes ? parseInt(formLikes, 10) : undefined,
          comments: formComments ? parseInt(formComments, 10) : undefined,
          shares: formShares ? parseInt(formShares, 10) : undefined,
          orders: formOrders ? parseInt(formOrders, 10) : undefined,
          revenue: formRevenue ? parseFloat(formRevenue) : undefined,
          commission: formCommission ? parseFloat(formCommission) : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError((body as { error?: string } | null)?.error ?? "Không thể lưu kết quả");
        return;
      }
      toast.success("Đã lưu kết quả video");
      setShowForm(false);
      resetForm();
      void fetchTracking();
    } catch {
      toast.error("Lỗi kết nối khi lưu kết quả");
    } finally {
      setSaving(false);
    }
  }

  function resetForm(): void {
    setFormAssetId("");
    setFormUrl("");
    setFormViews("");
    setFormLikes("");
    setFormComments("");
    setFormShares("");
    setFormOrders("");
    setFormRevenue("");
    setFormCommission("");
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/tracking/import-csv", { method: "POST", body: form });
      if (!res.ok) {
        setError(`Lỗi import CSV (${res.status})`);
        return;
      }
      const json = (await res.json()) as { message?: string };
      const msg = json.message || "Import xong";
      setImportMsg(msg);
      toast.success(msg);
      void fetchTracking();
    } catch {
      toast.error("Lỗi import CSV. Kiểm tra file và thử lại.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  // Summary stats
  const winners = entries.filter((e) => e.isWinner);
  const totalViews = entries.reduce((s, e) => s + (e.views24h ?? 0), 0);
  const totalOrders = entries.reduce((s, e) => s + (e.orders ?? 0), 0);
  const totalRevenue = entries.reduce((s, e) => s + (e.revenue ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 text-xs">✕</button>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Đóng form" : "Nhập kết quả"}
        </button>
        <label className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 text-sm font-medium transition-colors cursor-pointer">
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Import CSV từ TikTok Studio
          <input type="file" accept=".csv" onChange={(e) => void handleCsvImport(e)} className="hidden" />
        </label>
        {importMsg && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">{importMsg}</span>
        )}
      </div>

      {/* Manual entry form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Nhập kết quả video</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Video (asset)</label>
              <select className={inputCls + " w-full"} value={formAssetId} onChange={(e) => setFormAssetId(e.target.value)}>
                <option value="">Chọn video...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetCode} — {a.productIdentity?.title ?? a.format ?? "Video"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL TikTok</label>
              <input className={inputCls + " w-full"} value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Views 24h</label>
              <input className={inputCls + " w-full"} type="number" value={formViews} onChange={(e) => setFormViews(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Likes</label>
              <input className={inputCls + " w-full"} type="number" value={formLikes} onChange={(e) => setFormLikes(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Comments</label>
              <input className={inputCls + " w-full"} type="number" value={formComments} onChange={(e) => setFormComments(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Shares</label>
              <input className={inputCls + " w-full"} type="number" value={formShares} onChange={(e) => setFormShares(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn hàng</label>
              <input className={inputCls + " w-full"} type="number" value={formOrders} onChange={(e) => setFormOrders(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Doanh thu (VND)</label>
              <input className={inputCls + " w-full"} type="number" value={formRevenue} onChange={(e) => setFormRevenue(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hoa hồng (VND)</label>
              <input className={inputCls + " w-full"} type="number" value={formCommission} onChange={(e) => setFormCommission(e.target.value)} />
            </div>
          </div>
          <button
            onClick={() => void handleSubmit()}
            disabled={!formAssetId || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu kết quả
          </button>
        </div>
      )}

      {/* Summary stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Tổng video" value={String(entries.length)} icon={<BarChart3 className="w-4 h-4 text-blue-500" />} />
          <StatCard label="Winners" value={String(winners.length)} icon={<Trophy className="w-4 h-4 text-amber-500" />} />
          <StatCard label="Tổng views" value={formatNum(totalViews)} />
          <StatCard label="Doanh thu" value={formatVND(totalRevenue)} sub={`${totalOrders} đơn`} />
        </div>
      )}

      {/* Results table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="w-8 h-8 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500">Chưa có kết quả nào. Nhập kết quả video đã đăng.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-4 pt-4">Video</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-3 pt-4">Format</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-3 pt-4">Views</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-3 pt-4 hidden sm:table-cell">Likes</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-3 pt-4 hidden md:table-cell">Orders</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-3 pt-4 hidden md:table-cell">Revenue</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 px-3 pt-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {entries.map((entry) => {
                  const asset = entry.contentAsset;
                  const fmtLabel = asset.videoFormat ? (FORMAT_LABELS[asset.videoFormat] ?? asset.videoFormat) : (asset.format ?? "—");
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-900 dark:text-gray-50 truncate max-w-[200px]">
                          {asset.productIdentity?.title || asset.assetCode || "Video"}
                        </p>
                        <p className="text-[10px] text-gray-400">{asset.assetCode}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-400">{fmtLabel}</td>
                      <td className="py-3 px-3 text-sm text-right font-medium text-gray-900 dark:text-gray-50">{formatNum(entry.views24h)}</td>
                      <td className="py-3 px-3 text-sm text-right text-gray-600 dark:text-gray-400 hidden sm:table-cell">{formatNum(entry.likes)}</td>
                      <td className="py-3 px-3 text-sm text-right text-gray-600 dark:text-gray-400 hidden md:table-cell">{formatNum(entry.orders)}</td>
                      <td className="py-3 px-3 text-sm text-right text-gray-600 dark:text-gray-400 hidden md:table-cell">{formatVND(entry.revenue)}</td>
                      <td className="py-3 px-3 text-center">
                        {entry.isWinner ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                            <Trophy className="w-3 h-3" /> Win
                          </span>
                        ) : entry.views24h && entry.views24h > 0 ? (
                          <span className="text-xs text-gray-400">Đang test</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  sub?: string;
}): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
