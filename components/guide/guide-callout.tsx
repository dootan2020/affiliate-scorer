import { Lightbulb, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutVariant = "tip" | "success" | "info" | "warning";

const VARIANT_STYLES: Record<CalloutVariant, { bg: string; border: string; icon: string; Icon: React.ElementType }> = {
  tip: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", icon: "text-amber-500", Icon: Lightbulb },
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-500", Icon: CheckCircle2 },
  info: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", icon: "text-orange-500", Icon: Info },
  warning: { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", icon: "text-rose-500", Icon: AlertTriangle },
};

interface GuideCalloutProps {
  variant: CalloutVariant;
  children: React.ReactNode;
}

export function GuideCallout({ variant, children }: GuideCalloutProps): React.ReactElement {
  const s = VARIANT_STYLES[variant];
  const Icon = s.Icon;
  return (
    <div className={cn("not-prose rounded-xl border p-4 flex gap-3 my-6", s.bg, s.border)}>
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", s.icon)} />
      <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
}
