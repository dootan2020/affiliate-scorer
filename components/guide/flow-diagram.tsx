import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StepType = "input" | "ai" | "user" | "output" | "warning";

const STEP_STYLES: Record<StepType, string> = {
  input: "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700",
  ai: "border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700",
  user: "border-gray-300 bg-gray-50 dark:bg-slate-800 dark:border-slate-600",
  output: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700",
  warning: "border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700",
};

export interface FlowStep {
  icon: React.ElementType;
  title: string;
  description?: string;
  items?: string[];
  type: StepType;
  location?: string;
}

interface FlowDiagramProps {
  steps: FlowStep[];
  title?: string;
  description?: string;
}

export function FlowDiagram({ steps, title, description }: FlowDiagramProps): React.ReactElement {
  return (
    <div className="not-prose my-8">
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h4>
      )}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{description}</p>
      )}
      <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex flex-col md:flex-row items-center">
              <div
                className={cn(
                  "rounded-xl border-2 p-4 min-w-[170px] max-w-[220px] w-full md:w-auto",
                  STEP_STYLES[step.type]
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4 shrink-0 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {step.title}
                  </span>
                </div>
                {step.description && (
                  <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                )}
                {step.items && (
                  <ul className="mt-1.5 space-y-0.5">
                    {step.items.map((item, j) => (
                      <li key={j} className="text-xs text-gray-600 dark:text-slate-400">
                        • {item}
                      </li>
                    ))}
                  </ul>
                )}
                {step.location && (
                  <p className="mt-2 text-[10px] font-medium text-gray-400 dark:text-slate-500">
                    [{step.location}]
                  </p>
                )}
              </div>
              {i < steps.length - 1 && (
                <>
                  <ChevronRight className="hidden md:block w-5 h-5 text-gray-300 dark:text-slate-600 mx-1 shrink-0" />
                  <ChevronDown className="md:hidden w-5 h-5 text-gray-300 dark:text-slate-600 my-1 shrink-0" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
