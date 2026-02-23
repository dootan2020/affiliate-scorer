import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="text-5xl font-bold text-muted-foreground">404</div>
      <h2 className="text-lg font-semibold">Không tìm thấy trang</h2>
      <p className="text-sm text-muted-foreground">
        Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
