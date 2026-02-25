import Link from "next/link";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { formatVND } from "@/lib/utils/format";

interface CampaignListItem {
  id: string;
  name: string;
  productName: string | null;
  platform: string;
  status: string;
  roas: number | null;
  profitLoss: number;
}

interface CampaignListTableProps {
  campaigns: CampaignListItem[];
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  tiktok_shop: "TikTok Shop",
  shopee: "Shopee",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
};

function formatPlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function CampaignListTable({
  campaigns,
}: CampaignListTableProps): React.ReactElement {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
          Chưa có campaign nào
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Tao campaign dau tien de bat dau theo doi hieu qua quang cao.
        </p>
      </div>
    );
  }

  const activeCampaigns = campaigns.filter(
    (c) => c.status === "running" || c.status === "creating_content"
  );
  const netProfit = campaigns.reduce((sum, c) => sum + c.profitLoss, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">
                Ten
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 hidden sm:table-cell">
                SP
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4 hidden md:table-cell">
                Platform
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">
                Status
              </th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">
                ROAS
              </th>
              <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3 px-4">
                Lai/Lo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="text-gray-900 dark:text-gray-50 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {campaign.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400 truncate max-w-[140px] hidden sm:table-cell">
                  {campaign.productName ?? "-"}
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {formatPlatformLabel(campaign.platform)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <CampaignStatusBadge status={campaign.status} />
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={
                      campaign.roas !== null && campaign.roas >= 1
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  >
                    {campaign.roas !== null
                      ? `${campaign.roas.toFixed(2)}x`
                      : "-"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-medium ${
                      campaign.profitLoss >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {campaign.profitLoss >= 0 ? "+" : ""}
                    {formatVND(campaign.profitLoss)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl text-xs text-gray-500 dark:text-gray-400">
        <span>Tong: {campaigns.length} campaigns</span>
        <span>Dang chay: {activeCampaigns.length}</span>
        <span
          className={`font-medium ${
            netProfit >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          Net: {netProfit >= 0 ? "+" : ""}
          {formatVND(netProfit)}
        </span>
      </div>
    </div>
  );
}
