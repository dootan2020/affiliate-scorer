Cập nhật typography hierarchy cho TẤT CẢ card/widget trong toàn app. Áp dụng đồng bộ, không bỏ sót.

## Quy tắc card header

Mọi card/widget có title phải theo pattern:

```tsx
{/* Header bar */}
<div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-slate-800">
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-gray-400" />
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Title</h3>
  </div>
  {/* Action link nếu có */}
  <a className="text-xs text-orange-600 ...">Xem tất cả →</a>
</div>

{/* Content zone — cách header 16px (mb-4 ở trên) */}
```

## Checklist

| Thành phần | Giá trị |
|------------|---------|
| Card title | `text-base font-semibold text-gray-900 dark:text-gray-50` |
| Divider | `border-b border-gray-100 dark:border-slate-800` dưới header |
| Spacing | `pb-3 mb-4` (padding dưới title + margin trước content) |
| Body text | `text-sm text-gray-600 dark:text-gray-300` |
| Caption | `text-xs text-gray-400 dark:text-gray-500` |

## Scope — tìm và update TẤT CẢ widget/card headers

Dashboard:
- Morning Brief (đã text-base, thêm divider)
- Thêm sản phẩm nhanh
- Nên tạo content
- Inbox Pipeline
- Sắp tới

Các trang khác — scan mọi file component có card header pattern tương tự:
- Inbox, Production, Log, Library, Insights, Settings, Shops, Product detail

Dùng grep tìm `<h3` trong components/ và app/ để không bỏ sót.

## KHÔNG làm
- Không đổi H1 page title (đã OK ở 32px)
- Không đổi H2 section title (đã OK ở text-xl)
- Không đổi nội dung bên trong card, chỉ đổi header

Commit, push, build phải 0 errors.
