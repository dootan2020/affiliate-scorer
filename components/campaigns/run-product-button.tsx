"use client";

import Link from "next/link";
import { BarChart3, Rocket } from "lucide-react";
import { CampaignCreateModal } from "./campaign-create-modal";

interface RunProductButtonProps {
  productId: string;
  productName: string;
  affiliateLink?: string;
  activeCampaignId?: string;
}

export function RunProductButton({
  productId,
  productName,
  affiliateLink,
  activeCampaignId,
}: RunProductButtonProps): React.ReactElement {
  if (activeCampaignId) {
    return (
      <Link href={`/campaigns/${activeCampaignId}`}>
        <span className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors">
          <BarChart3 className="w-4 h-4" />
          Xem campaign đang chạy
        </span>
      </Link>
    );
  }

  return (
    <CampaignCreateModal
      productId={productId}
      productName={productName}
      affiliateLink={affiliateLink}
      trigger={
        <span className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all cursor-pointer">
          <Rocket className="w-4 h-4" />
          Chay SP nay
        </span>
      }
    />
  );
}
