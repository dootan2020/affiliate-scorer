import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { FeedbackTable } from "@/components/feedback/feedback-table";
import { FeedbackUpload } from "@/components/feedback/feedback-upload";
import { ManualFeedbackForm } from "@/components/feedback/manual-feedback-form";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Feedback Loop | AffiliateScorer",
};

async function getProducts() {
  return prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

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
  const [feedbacks, products] = await Promise.all([
    getFeedbacks(),
    getProducts(),
  ]);

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Feedback Loop
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload kết quả chiến dịch để AI học và cải thiện điểm số
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          ← Trang chủ
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
          Upload Dữ Liệu Feedback
        </h2>
        <FeedbackUpload />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-4">
          Nhập Kết Quả Thủ Công
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Cho kết quả organic hoặc khi không có file export
        </p>
        <ManualFeedbackForm products={products} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
          Lịch sử Feedback ({feedbacks.length} bản ghi)
        </h2>
        {feedbacks.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-slate-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <FeedbackTable feedbacks={tableData} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
              Chưa có dữ liệu feedback
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
              Upload file kết quả chiến dịch để bắt đầu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
