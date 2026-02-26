"use client";

import { PasteLinkBox } from "@/components/inbox/paste-link-box";
import { ClipboardPaste } from "lucide-react";

export function QuickPasteWidget(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-5">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
        <ClipboardPaste className="w-4 h-4 text-gray-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Thêm sản phẩm nhanh
        </h3>
      </div>
      <PasteLinkBox compact />
    </div>
  );
}
