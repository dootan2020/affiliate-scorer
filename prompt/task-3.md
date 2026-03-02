Activate skills:
- ui-ux-pro-max
- web-design-guidelines
- frontend-design
- research

Bước 1: Research UI/UX trends 2025-2026
Dùng WebFetch hoặc research skill để đọc các nguồn sau:
- https://www.uxstudioteam.com/ux-blog/ui-trends-2019 (UI trends 2026 by UX Studio)
- https://www.thefrontendcompany.com/posts/ui-trends (UI Trends 2026 for SaaS)
- https://www.index.dev/blog/ui-ux-design-trends (12 UI/UX Design Trends 2026)
- https://www.promodo.com/blog/key-ux-ui-design-trends (UX/UI Design Trends 2026)

Tổng hợp các trends phù hợp với PASTR: Bento Grid, Proactive UX, Data Storytelling, Microinteractions, Glassmorphism, Context-aware UI, Lightweight/fast loading.

Bước 2: Audit toàn bộ codebase UI
Đọc toàn bộ:
- app/**/page.tsx (tất cả 15 pages)
- components/** (tất cả components)
- app/api/** (data flow mỗi trang)
- Prisma schema (data models)
- docs/project-overview-pdr.md
- docs/ai-kol-koc-spec.md
- docs/ai-kol-koc-webapp-spec.md
- tailwind.config.* + globals.css (design tokens)

Bước 3: Tạo file docs/ui-ux-full-audit-and-redesign.md — báo cáo audit + đề xuất redesign TOÀN BỘ webapp.

## Yêu cầu báo cáo

### Phần 1: UI/UX Trends 2025-2026 tổng hợp
- Liệt kê trends đã research từ web
- Đánh giá trend nào phù hợp / không phù hợp với PASTR (personal tool, marketer VN, laptop + phone)
- Chọn 5-7 trends áp dụng được, giải thích cách áp dụng cụ thể

### Phần 2: Audit từng trang (15 trang)
Với MỖI trang, phân tích:
- Layout hiện tại: components nào, sắp xếp như thế nào
- Data hiển thị: lấy từ API nào, logic gì
- Vấn đề UX: thiếu gì, thừa gì, flow nào khó dùng, navigation nào broken
- Vấn đề UI: spacing, typography, color, responsive, empty states, loading states
- Mức độ nghiêm trọng: P0/P1/P2

15 trang:
1. / (Dashboard)
2. /inbox (Hộp sản phẩm)
3. /inbox/[id] (Chi tiết sản phẩm)
4. /production (Sản xuất)
5. /library (Thư viện)
6. /channels (Kênh TikTok)
7. /channels/[id] (Chi tiết kênh — 6 tabs)
8. /insights (Phân tích)
9. /log (Nhật ký)
10. /playbook (Playbook)
11. /sync (Đồng bộ dữ liệu)
12. /guide (Hướng dẫn)
13. /settings (Cài đặt)
14. 404 page
15. Error page

### Phần 3: Design System audit
- Color palette, dark mode
- Typography: Be Vietnam Pro, font sizes, line heights
- Spacing system (4px/8px grid?)
- Reusable components vs tự viết riêng mỗi trang
- Icons, Cards, Buttons, Forms, Tables, Modals
- Loading states, Empty states, Error states, Toasts
- Design tokens chung

### Phần 4: Đề xuất redesign cụ thể cho từng trang
Áp dụng trends đã research. Với MỖI trang:
- Layout mới (wireframe text)
- Components thêm/sửa/bỏ
- Navigation flow cải thiện
- Mobile layout
- Priority: P0/P1/P2

### Phần 5: Sidebar navigation audit
- Menu hierarchy, grouping logic
- Quick actions, badge counts
- Mobile navigation
- Active/hover states

### Phần 6: Cross-page consistency
- Header pattern, breadcrumb, back navigation
- Shared components nên extract
- Transition animations

### Phần 7: Action plan tổng hợp
- Xếp hạng priority
- Gộp batches implement tuần tự
- Estimate effort (S/M/L/XL)
- Dependencies giữa batches

## Ràng buộc
- PASTR là personal tool cho 1 marketer VN, không phải enterprise SaaS
- User mở app sáng trên laptop, đôi khi phone
- Giữ tech stack: Tailwind 4 + Radix UI + Lucide React + Recharts
- Không thêm heavy libraries (Framer Motion ok, Three.js không)
- Viết tiếng Việt, thuật ngữ design giữ tiếng Anh
- Đọc code thực tế, ghi rõ file path khi reference
- Báo cáo chi tiết — tài liệu để implement nhiều sprint