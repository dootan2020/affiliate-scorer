# Tạo Bộ Tiêu Chuẩn Chung cho PASTR

## Vấn đề

PASTR không có design system hay coding standards. Mỗi feature được build với style riêng, logic riêng, dẫn đến inconsistency liên tục. Audit 61 issues phần lớn vì thiếu tiêu chuẩn chung.

## Yêu cầu

Quét toàn bộ codebase hiện tại, tổng hợp pattern đang dùng phổ biến nhất, rồi tạo 1 file `STANDARDS.md` ở root project. File này là nguồn tham chiếu bắt buộc cho mọi feature mới.

Nội dung cần cover:

### 1. Design Tokens
- Colors: primary (orange), gray scale, semantic (success/warning/error/info)
- Spacing: khi nào p-4, p-5, p-6
- Typography: heading sizes, body text, labels, captions
- Border radius: card, badge, button, input
- Shadows: card, dropdown, modal

### 2. Component Patterns
- Card: padding, border, hover, dark mode
- Badge/Tag: padding, colors theo loại (status, type, priority)
- Button: sizes, variants, touch target
- Empty state: icon size, text, CTA
- Loading state: skeleton cho page load, spinner cho action
- Error state: inline error + retry button
- Toast: khi nào dùng, success/error format
- Form: label style, input style, validation message

### 3. API Patterns
- Response format: success, error, list with pagination
- Error handling: status codes, error object structure
- Validation: Zod schema conventions
- Cache strategy: khi nào cache, TTL bao lâu, invalidate khi nào

### 4. Data Patterns
- Query: select fields, include relations, pagination
- Mutation: transaction khi nào, optimistic update khi nào
- channelId: bắt buộc ở đâu, optional ở đâu

### 5. File/Folder Conventions
- Component file naming
- API route structure
- Type/interface location
- Hook naming

Sau khi tạo STANDARDS.md, scan codebase xem có chỗ nào vi phạm nghiêm trọng không — liệt kê nhưng không fix (để tôi duyệt).
