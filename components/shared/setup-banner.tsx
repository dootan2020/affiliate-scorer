"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

export function SetupBanner(): React.ReactElement | null {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show on settings page (user is already there)
    if (pathname === "/settings") return;

    let cancelled = false;
    fetch("/api/settings/api-keys/status")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const providers = data.providers as
          | { isConnected: boolean }[]
          | undefined;
        const hasConnected = providers?.some((p) => p.isConnected);
        if (!hasConnected) setVisible(true);
      })
      .catch(() => {
        // Network/parse error — don't show banner
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!visible || dismissed) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Chưa có API key
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
          Vui lòng kết nối ít nhất 1 nhà cung cấp AI để sử dụng các tính năng
          chấm điểm và tạo nội dung.{" "}
          <Link
            href="/settings"
            className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
          >
            Đi đến Cài đặt &rarr;
          </Link>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shrink-0"
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
