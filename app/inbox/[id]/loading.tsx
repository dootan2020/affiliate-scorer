export default function InboxDetailLoading(): React.ReactElement {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-5 w-32 bg-gray-200 dark:bg-slate-800 rounded" />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="flex gap-2 mt-1">
            <div className="h-6 w-20 bg-gray-100 dark:bg-slate-800/70 rounded-full" />
            <div className="h-6 w-24 bg-gray-100 dark:bg-slate-800/70 rounded-full" />
          </div>
        </div>
        <div className="h-16 w-16 rounded-2xl bg-gray-200 dark:bg-slate-800 shrink-0" />
      </div>

      {/* Key metrics */}
      <div className="bg-gray-100 dark:bg-slate-800/50 rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16" />
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-20" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Brief button */}
      <div className="h-10 w-36 bg-gray-200 dark:bg-slate-800 rounded-xl" />

      {/* Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-32" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 dark:bg-slate-800/70 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
