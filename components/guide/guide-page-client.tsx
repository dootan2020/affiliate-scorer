"use client";

import { useEffect, useRef, useState } from "react";
import { GuideToc, GuideTocMobile, type TocItem } from "./guide-toc";
import { GuideContent } from "./guide-content";

const TOC_ITEMS: TocItem[] = [
  { id: "bat-dau", label: "1. Bắt đầu nhanh" },
  { id: "workflow", label: "2. Workflow hàng ngày" },
  { id: "dashboard", label: "3. Dashboard" },
  { id: "inbox", label: "4. Inbox" },
  { id: "sync", label: "5. Sync" },
  { id: "san-xuat", label: "6. Sản xuất" },
  { id: "log", label: "7. Log" },
  { id: "insights", label: "8. Insights" },
  { id: "cau-hinh-ai", label: "9. Cấu hình AI" },
  { id: "faq", label: "10. FAQ" },
  { id: "tips", label: "11. Tips & Tricks" },
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
