import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        Không tìm thấy trang
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Link
        href="/"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-sm hover:shadow transition-all"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
