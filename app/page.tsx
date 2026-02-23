export default function DashboardPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Top picks hôm nay và AI insights
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Chưa có dữ liệu. Hãy upload CSV từ FastMoss hoặc KaloData để bắt đầu.
      </div>
    </div>
  );
}
