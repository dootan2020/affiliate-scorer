interface CampaignStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  planning: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-300",
    label: "Planning",
  },
  creating_content: {
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-400",
    label: "Tao content",
  },
  running: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "Dang chay",
  },
  paused: {
    bg: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-400",
    label: "Tam dung",
  },
  completed: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-400",
    label: "Hoan thanh",
  },
  cancelled: {
    bg: "bg-rose-50 dark:bg-rose-950",
    text: "text-rose-700 dark:text-rose-400",
    label: "Da huy",
  },
};

export function CampaignStatusBadge({
  status,
}: CampaignStatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.planning;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
