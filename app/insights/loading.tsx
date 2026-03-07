export default function InsightsLoading(): React.ReactElement {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-36 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
          <div className="h-4 w-56 bg-gray-100 dark:bg-slate-800 animate-pulse rounded mt-2" />
        </div>
        <div className="h-9 w-28 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
            <div className="h-4 w-24 bg-gray-100 dark:bg-slate-800 animate-pulse rounded mb-3" />
            <div className="h-10 w-20 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
            <div className="h-3 w-32 bg-gray-50 dark:bg-slate-800/50 animate-pulse rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="h-5 w-40 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
        <div className="h-48 bg-gray-50 dark:bg-slate-800/50 animate-pulse rounded-xl" />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="h-5 w-32 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-50 dark:bg-slate-800/50 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
