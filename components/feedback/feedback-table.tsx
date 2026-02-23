"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface FeedbackRow {
  id: string;
  productName: string;
  aiScoreAtSelection: number;
  adPlatform: string | null;
  salesPlatform: string | null;
  adROAS: number | null;
  revenue: number | null;
  overallSuccess: string;
  feedbackDate: string;
}

interface FeedbackTableProps {
  feedbacks: FeedbackRow[];
}

const SUCCESS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  success: { label: "Tốt", variant: "default" },
  moderate: { label: "Trung bình", variant: "secondary" },
  poor: { label: "Kém", variant: "destructive" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatROASOrRevenue(roas: number | null, revenue: number | null): string {
  if (roas !== null) return `ROAS ${roas.toFixed(2)}x`;
  if (revenue !== null) return `${revenue.toLocaleString("vi-VN")} ₫`;
  return "—";
}

export function FeedbackTable({ feedbacks }: FeedbackTableProps): React.ReactElement {
  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Chưa có dữ liệu feedback. Upload file để bắt đầu.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sản phẩm</TableHead>
            <TableHead className="text-right">Điểm AI lúc chọn</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>ROAS / Doanh thu</TableHead>
            <TableHead>Kết quả</TableHead>
            <TableHead>Ngày</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((fb) => {
            const platform = fb.adPlatform ?? fb.salesPlatform ?? "—";
            const successInfo = SUCCESS_BADGE[fb.overallSuccess] ?? SUCCESS_BADGE.moderate;

            return (
              <TableRow key={fb.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {fb.productName}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fb.aiScoreAtSelection.toFixed(1)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground capitalize">
                  {platform}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {formatROASOrRevenue(fb.adROAS, fb.revenue)}
                </TableCell>
                <TableCell>
                  <Badge variant={successInfo.variant}>{successInfo.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(fb.feedbackDate)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
