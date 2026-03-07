export default function LogLoading(): React.ReactElement {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="h-8 w-32 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
        <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800 animate-pulse rounded mt-2" />
      </div>
      <div className="h-12 bg-orange-50 dark:bg-orange-950/20 rounded-xl animate-pulse" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="h-10 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-50 dark:bg-slate-800/50 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
