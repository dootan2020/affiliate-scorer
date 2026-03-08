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
  { id: "kenh-tiktok", label: "10. Kênh TikTok" },
  { id: "co-van-ai", label: "11. Cố vấn AI" },
  { id: "telegram-bot", label: "12. Telegram Bot" },
  { id: "cau-hinh-ai", label: "13. Cấu hình AI" },
  { id: "cau-hoi", label: "14. Câu hỏi thường gặp" },
  { id: "meo", label: "15. Mẹo sử dụng" },
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
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 },
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Fixed TOC sidebar — positioned right after the main app sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
        <div className="sticky top-0 h-screen overflow-y-auto py-8 px-4">
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Hướng dẫn
          </p>
          <p className="px-3 mb-5 text-xs text-gray-400 dark:text-gray-500">
            PASTR Documentation
          </p>
          <GuideToc items={TOC_ITEMS} activeId={activeId} />
        </div>
      </aside>

      {/* Main content area — fills remaining width */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-slate-800 px-6 sm:px-10 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Hướng dẫn sử dụng PASTR
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Paste links. Ship videos. Learn fast.
          </p>
        </div>

        {/* Mobile TOC dropdown */}
        <div className="lg:hidden px-6 sm:px-10 pt-6">
          <GuideTocMobile items={TOC_ITEMS} activeId={activeId} />
        </div>

        {/* Prose content — larger text, wider, better reading experience */}
        <div className="px-6 sm:px-10 py-8 max-w-4xl">
          <div className="prose prose-gray dark:prose-invert prose-headings:scroll-mt-20 prose-h2:text-2xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:mt-16 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100 prose-h2:dark:border-slate-800 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-p:text-base prose-p:leading-7 prose-li:text-base prose-li:leading-7 prose-code:text-sm prose-pre:text-sm max-w-none">
            <GuideContent />
          </div>
        </div>
      </div>
    </div>
  );
}
