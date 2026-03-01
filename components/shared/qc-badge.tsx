"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface QcCheck {
  check: string;
  status: "pass" | "warn";
  message: string;
  script?: number;
}

interface Props {
  status: string | null;
  details: QcCheck[] | null;
}

const CHECK_LABELS: Record<string, string> = {
  catchphrase: "Catchphrase",
  hook_length: "Độ dài hook",
  proof_section: "Phần chứng minh",
  cta_pattern: "CTA",
  red_lines: "Red lines",
};

export function QcBadge({ status, details }: Props): React.ReactElement | null {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!status) return null;

  const isPass = status === "pass";
  const checks = (details ?? []) as QcCheck[];
  const warns = checks.filter((c) => c.status === "warn");

  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
          isPass
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
        }`}
      >
        {isPass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        QC {isPass ? "Pass" : `${warns.length} cảnh báo`}
      </button>

      {showTooltip && checks.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-3 space-y-1.5">
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              {c.status === "pass" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-medium text-gray-500">
                  {CHECK_LABELS[c.check] ?? c.check}
                  {c.script ? ` (Script ${c.script})` : ""}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">{c.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
