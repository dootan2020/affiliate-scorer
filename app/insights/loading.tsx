export default function InsightsLoading(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
      <div>
        <div className="h-8 w-36 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
        <div className="h-4 w-56 bg-gray-100 dark:bg-slate-800 animate-pulse rounded mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
          <div className="h-16 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
          <div className="h-16 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6">
        <div className="h-48 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
      </div>
    </div>
  );
}
