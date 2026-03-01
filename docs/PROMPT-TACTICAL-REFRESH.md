# Build: Tactical Refresh cho TikTok Channel

## Vấn đề

TikTok thay đổi cực nhanh — trending hook/format/sound thay đổi hàng tuần. Kênh giữ mãi tactics cũ từ ngày tạo sẽ chết view. Cần tính năng refresh tactics định kỳ.

## Kết quả cần đạt

### Nút "🔄 Refresh Tactics" trên channel detail page

Bấm vào → dialog với 2 input:

1. **Textarea "Trending tuần này"** — user mô tả trending đang thấy trên TikTok (format hot, hook viral, sound trending). Đây là input quan trọng nhất.

2. **Checkbox "Phân tích tracking data"** — nếu có ≥10 videos tracked thì enable, AI dùng data performance để suggest. Nếu <10 videos → disable, ghi chú lý do.

Nếu cả 2 đều trống → không cho generate.

### AI đề xuất danh sách thay đổi

Bấm generate → AI trả về danh sách suggestions, mỗi cái có lý do. User review từng cái bằng checkbox → Accept đã chọn → save vào channel.

### Quy tắc bất di bất dịch

**Identity KHÔNG BAO GIỜ bị suggest thay đổi:** name, handle, persona, subNiche, usp, targetAudience, voiceStyle, colors, fonts.

**Tactics được suggest:** hookBank, contentMix, contentPillars, contentPillarDetails, postingSchedule, postsPerDay, seriesSchedule, videoFormats, ctaTemplates, competitorChannels, editingStyle.

**Chỉ ảnh hưởng nội dung tương lai.** Briefs đã tạo, video đã sản xuất, video đã đăng, tracking data → KHÔNG thay đổi. Refresh = cập nhật channel record → lần tạo brief tiếp theo tự động dùng data mới.

### Không cần schema change

Suggestions apply trực tiếp vào existing JSON fields của TikTokChannel. Không cần table mới, không cần migration.
