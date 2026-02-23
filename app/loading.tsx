export default function DashboardLoading(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-4 w-64 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl mt-2" />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-6 w-10 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-6 w-12 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-full" />
              <div className="h-6 flex-1 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-6 w-20 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <div className="h-4 w-24 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />
          <div className="h-10 w-20 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
          <div className="h-4 w-32 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl mb-3" />
          <div className="h-16 w-full animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
