"use client";

import Link from "next/link";
import { ClipboardPlus } from "lucide-react";

export function MobileFab(): React.ReactElement {
  return (
    <Link
      href="/log"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all md:hidden"
      aria-label="Log kết quả nhanh"
    >
      <ClipboardPlus className="h-6 w-6" />
    </Link>
  );
}
