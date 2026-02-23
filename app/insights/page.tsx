export default function InsightsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Phân tích accuracy, patterns và chiến lược từ AI
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Chưa có insights. Upload feedback data để AI bắt đầu phân tích.
      </div>
    </div>
  );
}
