import { Card, CardContent } from "@/components/ui/card";

export default function ProductDetailLoading(): React.ReactElement {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="h-8 w-24 bg-muted animate-pulse rounded" />
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="h-7 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="h-16 w-16 bg-muted animate-pulse rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 bg-muted animate-pulse rounded" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 bg-muted animate-pulse rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
