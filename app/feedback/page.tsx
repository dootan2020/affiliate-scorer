export default function FeedbackPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kết Quả Thật</h1>
        <p className="text-muted-foreground">
          Lịch sử feedback từ ads và organic performance
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Chưa có dữ liệu feedback. Upload kết quả từ FB Ads, TikTok Ads hoặc
        Shopee.
      </div>
    </div>
  );
}
