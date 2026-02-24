import {
  Banknote,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  CircleDollarSign,
} from "lucide-react";

interface CampaignSummaryCardsProps {
  totalSpend: number;
  totalRevenue: number;
  totalOrders: number;
  roas: number | null;
  profitLoss: number;
}

function formatVNDCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (abs >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return `${Math.round(amount)}d`;
}

export function CampaignSummaryCards({
  totalSpend,
  totalRevenue,
  totalOrders,
  roas,
  profitLoss,
}: CampaignSummaryCardsProps): React.ReactElement {
  const cards = [
    {
      label: "Chi",
      value: formatVNDCompact(totalSpend),
      icon: Banknote,
      color: "text-gray-600 dark:text-gray-300",
      iconBg: "bg-gray-100 dark:bg-slate-800",
    },
    {
      label: "Thu",
      value: formatVNDCompact(totalRevenue),
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Don",
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "ROAS",
      value: roas !== null ? `${roas.toFixed(2)}x` : "-",
      icon: BarChart3,
      color:
        roas !== null && roas >= 1
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-gray-600 dark:text-gray-300",
      iconBg:
        roas !== null && roas >= 1
          ? "bg-emerald-50 dark:bg-emerald-950"
          : "bg-gray-100 dark:bg-slate-800",
    },
    {
      label: "Lai/Lo",
      value: `${profitLoss >= 0 ? "+" : ""}${formatVNDCompact(profitLoss)}`,
      icon: CircleDollarSign,
      color:
        profitLoss >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
      iconBg:
        profitLoss >= 0
          ? "bg-emerald-50 dark:bg-emerald-950"
          : "bg-rose-50 dark:bg-rose-950",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center`}
            >
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {card.label}
            </span>
          </div>
          <p className={`text-lg font-semibold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
