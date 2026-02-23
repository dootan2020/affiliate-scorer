import { Card, CardContent } from "@/components/ui/card";

export default function FeedbackLoading(): React.ReactElement {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="h-7 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="h-24 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
