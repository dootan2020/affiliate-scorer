import { Card, CardContent } from "@/components/ui/card";

export default function InsightsLoading(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
      <div>
        <div className="h-8 w-36 bg-muted animate-pulse rounded" />
        <div className="h-4 w-56 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="h-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="h-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="h-48 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}
