"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PipelineStep {
  key: string;
  label: string;
  count?: number;
}

interface PipelineStepperProps {
  steps: PipelineStep[];
  activeStep: string;
  onStepChange: (key: string) => void;
  className?: string;
}

export function PipelineStepper({
  steps,
  activeStep,
  onStepChange,
  className,
}: PipelineStepperProps): React.ReactElement {
  const activeIndex = steps.findIndex((s) => s.key === activeStep);

  return (
    <div
      className={cn(
        "overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0",
        className,
      )}
    >
      <nav className="flex items-center min-w-max sm:min-w-0 sm:w-full">
        {steps.map((step, idx) => {
          const isActive = step.key === activeStep;
          const isCompleted = idx < activeIndex;
          const isLast = idx === steps.length - 1;
          const stepNumber = idx + 1;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step button */}
              <button
                onClick={() => onStepChange(step.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 group transition-all px-3 py-2",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 rounded-xl",
                )}
              >
                {/* Circle + label row */}
                <div className="flex items-center gap-2">
                  {/* Number circle */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                        : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-slate-600",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ) : (
                      stepNumber
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-sm font-medium whitespace-nowrap transition-colors",
                      isActive
                        ? "text-gray-900 dark:text-gray-50"
                        : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300",
                    )}
                  >
                    {step.label}
                  </span>

                  {/* Count badge */}
                  {step.count != null && step.count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none transition-colors",
                        isActive
                          ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
                          : isCompleted
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {step.count}
                    </span>
                  )}
                </div>
              </button>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex-1 h-px mx-1 transition-colors"
                  style={{ minWidth: "16px" }}
                >
                  <div
                    className={cn(
                      "h-full transition-colors",
                      idx < activeIndex
                        ? "bg-emerald-300 dark:bg-emerald-700"
                        : "bg-gray-200 dark:bg-slate-700",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
