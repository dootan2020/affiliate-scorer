export default function UploadLoading(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="rounded-lg border border-dashed p-12 flex items-center justify-center">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
      </div>
      <div className="rounded-lg border border-dashed p-12 flex items-center justify-center">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
