# Reset Database — Xóa toàn bộ dữ liệu test cũ

## Lý do

Database hiện tại chứa dữ liệu giả từ các lần test trước. Từ giờ trở đi chỉ dùng dữ liệu thật để phục vụ học máy và phân tích. Cần reset sạch.

## Yêu cầu

Xóa toàn bộ data trong các bảng theo đúng thứ tự (tránh foreign key conflict):

1. VideoTracking
2. ContentSlot
3. ContentBrief
4. ContentAsset
5. ProductIdentity
6. TikTokChannel

Giữ nguyên:
- Schema (không drop table)
- User account
- AI config (Settings)
- App structure

Sau khi xóa, verify: mở app → Dashboard trống, Inbox trống, Channels trống. Không lỗi, không crash.
