"use client";

import { useState } from "react";
import { ClipboardPaste, Loader2, Link2, Package, Film, Store, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PasteResult {
  total: number;
  newProducts: number;
  duplicates: number;
  videos: number;
  shops: number;
  failed: number;
}

interface PasteLinkBoxProps {
  /** Callback khi paste xong → refresh danh sách */
  onComplete?: () => void;
  /** Compact mode cho dashboard widget */
  compact?: boolean;
}

export function PasteLinkBox({ onComplete, compact }: PasteLinkBoxProps): React.ReactElement {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PasteResult | null>(null);

  async function handleSubmit(): Promise<void> {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/inbox/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Có lỗi xảy ra");
        return;
      }

      setResult(data.data);
      toast.success(data.message);
      setText("");
      onComplete?.();
    } catch {
      toast.error("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dán link TikTok Shop / FastMoss vào đây..."
            rows={2}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ClipboardPaste className="w-4 h-4" />
          )}
          Thêm vào Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Dán links vào đây (product, video, shop — TikTok/FastMoss)\n\nhttps://shop.tiktok.com/view/product/173417...\nhttps://www.tiktok.com/@user/video/73799...\nhttps://www.fastmoss.com/zh/e-commerce/detail/17341..."}
          rows={6}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Link2 className="w-3 h-3" />
          Mỗi link 1 dòng
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ClipboardPaste className="w-4 h-4" />
          )}
          Thêm vào Inbox
        </button>

        {text.trim() && (
          <span className="text-xs text-gray-400">
            {text.split("\n").filter((l) => l.trim().startsWith("http")).length} links
          </span>
        )}
      </div>

      {/* Kết quả */}
      {result && (
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Kết quả: {result.total} links
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            {result.newProducts > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Package className="w-3.5 h-3.5" />
                {result.newProducts} sản phẩm mới
              </span>
            )}
            {result.duplicates > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                {result.duplicates} đã có
              </span>
            )}
            {result.videos > 0 && (
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <Film className="w-3.5 h-3.5" />
                {result.videos} video
              </span>
            )}
            {result.shops > 0 && (
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <Store className="w-3.5 h-3.5" />
                {result.shops} shop
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
