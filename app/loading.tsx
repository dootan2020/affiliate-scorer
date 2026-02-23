import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-6 w-10 bg-muted animate-pulse rounded" />
                <div className="h-6 w-12 bg-muted animate-pulse rounded-full" />
                <div className="h-6 flex-1 bg-muted animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
