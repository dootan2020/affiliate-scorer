import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
        Không tìm thấy trang
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Button asChild className="w-full sm:w-auto">
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
