export default function DashboardLoading(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 animate-pulse bg-gray-200 rounded-xl" />
        <div className="h-4 w-64 animate-pulse bg-gray-200 rounded-xl mt-2" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-6 w-10 animate-pulse bg-gray-200 rounded-xl" />
              <div className="h-6 w-12 animate-pulse bg-gray-200 rounded-full" />
              <div className="h-6 flex-1 animate-pulse bg-gray-200 rounded-xl" />
              <div className="h-6 w-20 animate-pulse bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-4 w-24 animate-pulse bg-gray-200 rounded-xl mb-3" />
          <div className="h-10 w-20 animate-pulse bg-gray-200 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-4 w-32 animate-pulse bg-gray-200 rounded-xl mb-3" />
          <div className="h-16 w-full animate-pulse bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
