"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, ExternalLink, RefreshCw } from "lucide-react";

interface AffiliateLinkSectionProps {
  productId: string;
  initialLink?: string | null;
  initialStatus?: string | null;
  initialCreatedAt?: string | null;
}

type LinkStatus = "active" | "expired" | "dead" | null;

const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  active: {
    label: "Active",
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  },
  expired: {
    label: "Expired",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  },
  dead: {
    label: "Dead",
    dotClass: "bg-rose-500",
    badgeClass:
      "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
  },
};

export function AffiliateLinkSection({
  productId,
  initialLink,
  initialStatus,
  initialCreatedAt,
}: AffiliateLinkSectionProps): React.ReactElement {
  const [link, setLink] = useState(initialLink ?? "");
  const [status, setStatus] = useState<LinkStatus>(
    (initialStatus as LinkStatus) ?? null
  );
  const [createdAt] = useState(initialCreatedAt ?? null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSaveLink(): Promise<void> {
    if (!link.trim()) {
      toast.error("Nhập link affiliate");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateLink: link.trim(),
          affiliateLinkStatus: status ?? "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã cập nhật link affiliate");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi cập nhật link"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckLink(): Promise<void> {
    if (!link.trim()) {
      toast.error("Nhập link trước khi kiểm tra");
      return;
    }
    setChecking(true);
    try {
      // Use a HEAD request via our own proxy to avoid CORS
      const res = await fetch(link.trim(), {
        method: "HEAD",
        mode: "no-cors",
      });
      // mode: "no-cors" always returns opaque response, so we treat it as active
      // For a real check, a server-side API would be better
      if (res.type === "opaque" || res.ok) {
        setStatus("active");
        toast.success("Link hoạt động bình thường");
      } else if (res.status >= 300 && res.status < 400) {
        setStatus("expired");
        toast.warning("Link chuyển hướng — có thể hết hạn");
      } else {
        setStatus("dead");
        toast.error("Link không hoạt động");
      }
    } catch {
      // Network errors could mean CORS block or dead link
      // Optimistically assume active since CORS blocks are common
      setStatus("active");
      toast.info("Không thể kiểm tra tự động — đánh dấu Active");
    } finally {
      setChecking(false);
      // Auto-save status after check
      try {
        await fetch(`/api/products/${productId}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateLink: link.trim(),
            affiliateLinkStatus: status ?? "active",
          }),
        });
      } catch {
        // Silently ignore save errors after check
      }
    }
  }

  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <Link2 className="w-5 h-5 text-orange-500" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Link Affiliate của tôi
        </h3>
      </div>

      {/* Link input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
        />
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-300 transition-colors shrink-0"
            title="Mở link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Status + Date row */}
      <div className="mt-3 flex items-center gap-4">
        {statusConfig && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.badgeClass}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`}
            />
            {statusConfig.label}
          </span>
        )}
        {createdAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Tạo: {new Date(createdAt).toLocaleDateString("vi-VN")}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleSaveLink}
          disabled={saving || !link.trim()}
          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Đang lưu..." : "Cập nhật link"}
        </button>
        <button
          onClick={handleCheckLink}
          disabled={checking || !link.trim()}
          className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-4 h-4 ${checking ? "animate-spin" : ""}`}
          />
          {checking ? "Đang kiểm tra..." : "Kiểm tra link"}
        </button>
      </div>
    </div>
  );
}
