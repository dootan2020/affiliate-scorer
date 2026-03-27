/** Color class for niche score text */
export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-gray-400";
}

/** Background class for niche score badge */
export function scoreBgClass(score: number): string {
  if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/40";
  if (score >= 60) return "bg-blue-50 dark:bg-blue-950/40";
  if (score >= 40) return "bg-amber-50 dark:bg-amber-950/40";
  return "bg-gray-100 dark:bg-slate-800";
}
