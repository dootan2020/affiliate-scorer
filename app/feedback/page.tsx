import Link from "next/link";
import { prisma } from "@/lib/db";
import { FeedbackTable } from "@/components/feedback/feedback-table";
import { FeedbackUpload } from "@/components/feedback/feedback-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getFeedbacks() {
  try {
    return await prisma.feedback.findMany({
      orderBy: { feedbackDate: "desc" },
      take: 100,
      select: {
        id: true,
        aiScoreAtSelection: true,
        adPlatform: true,
        salesPlatform: true,
        adROAS: true,
        revenue: true,
        overallSuccess: true,
        feedbackDate: true,
        product: { select: { name: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function FeedbackPage(): Promise<React.ReactElement> {
  const feedbacks = await getFeedbacks();

  const tableData = feedbacks.map((fb) => ({
    id: fb.id,
    productName: fb.product.name,
    aiScoreAtSelection: fb.aiScoreAtSelection,
    adPlatform: fb.adPlatform,
    salesPlatform: fb.salesPlatform,
    adROAS: fb.adROAS,
    revenue: fb.revenue,
    overallSuccess: fb.overallSuccess,
    feedbackDate: fb.feedbackDate.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Feedback Loop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload kết quả chiến dịch để AI học và cải thiện điểm số
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">← Trang chủ</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upload Dữ Liệu Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackUpload />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3">
          Lịch sử Feedback ({feedbacks.length} bản ghi)
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[600px] px-4 sm:px-0">
            <FeedbackTable feedbacks={tableData} />
          </div>
        </div>
      </div>
    </div>
  );
}
