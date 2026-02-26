"use client";

import { useEffect, useRef, useState } from "react";
import { GuideToc, GuideTocMobile, type TocItem } from "./guide-toc";
import { GuideContent } from "./guide-content";

const TOC_ITEMS: TocItem[] = [
  { id: "bat-dau", label: "1. Bắt đầu nhanh" },
  { id: "quy-trinh", label: "2. Quy trình hàng ngày" },
  { id: "luong-cong-viec", label: "3. Luồng công việc" },
  { id: "wf-tong-quan", label: "3.1 Sơ đồ tổng quan", indent: true },
  { id: "wf-cai-dat", label: "3.2 Cài đặt ban đầu", indent: true },
  { id: "wf-dan-link", label: "3.3 Thêm SP bằng link", indent: true },
  { id: "wf-fastmoss", label: "3.4 Thêm SP hàng loạt", indent: true },
  { id: "wf-tiktok-studio", label: "3.5 Đồng bộ TikTok Studio", indent: true },
  { id: "wf-cham-diem", label: "3.6 Chấm điểm SP", indent: true },
  { id: "wf-brief", label: "3.7 Tạo Brief nội dung", indent: true },
  { id: "wf-san-xuat-ngay", label: "3.8 Sản xuất ngày", indent: true },
  { id: "wf-nhat-ky", label: "3.9 Nhật ký & phản hồi", indent: true },
  { id: "wf-hoc", label: "3.10 Vòng lặp học AI", indent: true },
  { id: "wf-thu-chi", label: "3.11 Theo dõi thu chi", indent: true },
  { id: "wf-chien-dich", label: "3.12 Chiến dịch sale", indent: true },
  { id: "tong-quan", label: "4. Tổng quan" },
  { id: "hop-san-pham", label: "5. Hộp sản phẩm" },
  { id: "dong-bo", label: "6. Đồng bộ dữ liệu" },
  { id: "san-xuat", label: "7. Sản xuất" },
  { id: "nhat-ky", label: "8. Nhật ký" },
  { id: "phan-tich", label: "9. Phân tích" },
  { id: "cau-hinh-ai", label: "10. Cấu hình AI" },
  { id: "cau-hoi", label: "11. Câu hỏi thường gặp" },
  { id: "meo", label: "12. Mẹo sử dụng" },
];

export function GuidePageClient(): React.ReactElement {
  const [activeId, setActiveId] = useState(TOC_ITEMS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = TOC_ITEMS.map((i) => i.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="flex gap-8">
      {/* Desktop TOC */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-6">
          <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Mục lục
          </p>
          <GuideToc items={TOC_ITEMS} activeId={activeId} />
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl">
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-gray-900 dark:text-gray-50 mb-2">
          Hướng dẫn sử dụng PASTR
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Paste links. Ship videos. Learn fast.
        </p>

        {/* Mobile TOC dropdown */}
        <div className="lg:hidden">
          <GuideTocMobile items={TOC_ITEMS} activeId={activeId} />
        </div>

        <div className="prose prose-gray dark:prose-invert prose-headings:scroll-mt-20 prose-h2:text-xl prose-h2:font-semibold prose-h2:tracking-tight prose-h3:text-base prose-h3:font-medium prose-sm max-w-none">
          <GuideContent />
        </div>
      </div>
    </div>
  );
}
