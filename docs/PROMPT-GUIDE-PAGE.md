Tạo trang hướng dẫn sử dụng `/guide` trong app, style giống GitBook (TOC trái + content phải). Thêm link "Hướng dẫn" vào sidebar (icon 📖 BookOpen, đặt giữa Insights và Settings).

---

## LAYOUT

```tsx
// app/guide/page.tsx
// Desktop: TOC trái sticky (w-56) + content phải scrollable
// Mobile: dropdown chọn section ở đầu trang, content bên dưới
// TOC highlight section đang đọc (Intersection Observer)
// Smooth scroll khi click TOC item
```

Style content area:
- Max width 720px (prose đọc dễ)
- `prose prose-gray dark:prose-invert` (Tailwind Typography)
- Headings: anchor links
- Callout boxes cho tips/warnings (rounded-xl, bg-amber-50 / bg-orange-50 / bg-emerald-50)
- Code blocks nếu cần

Cài thêm `@tailwindcss/typography` nếu chưa có:
```bash
pnpm add @tailwindcss/typography
```

---

## NỘI DUNG

### 1. Bắt đầu nhanh

#### Bước 1: Kết nối API key
Vào **Cài đặt** → chọn nhà cung cấp AI (Anthropic, OpenAI, hoặc Google) → nhập API key → click **Kiểm tra kết nối**.

Lấy key tại:
- Anthropic: console.anthropic.com
- OpenAI: platform.openai.com/api-keys
- Google: aistudio.google.com/apikey

#### Bước 2: Chọn model AI
Mỗi tác vụ có thể dùng model khác nhau. Xem mục **Cấu hình AI khuyến nghị** bên dưới.

#### Bước 3: Thêm sản phẩm đầu tiên
2 cách:
- **Paste link**: Dashboard → "Thêm sản phẩm nhanh" → dán link TikTok Shop hoặc FastMoss
- **Upload file**: Sync → kéo thả file XLSX từ FastMoss

AI sẽ tự động chấm điểm sản phẩm (1-100).

#### Bước 4: Tạo brief đầu tiên
Inbox → chọn sản phẩm score cao → click **Tạo Brief** → AI generate script, hooks, angles cho video TikTok.

---

### 2. Workflow hàng ngày

Callout box (bg-orange-50, border-orange-200):
```
💡 Quy trình khuyến nghị mỗi ngày:
Sáng đọc Brief → Trưa tìm SP mới → Chiều quay video → Tối log kết quả
```

**Buổi sáng — Đọc Morning Brief**
Mở Dashboard. Morning Brief cho bạn biết:
- Hôm nay nên sản xuất video cho sản phẩm nào
- Bao nhiêu video cần quay
- Sản phẩm mới nào đáng chú ý
- Sự kiện sắp tới (Mega Sale, 8/3, v.v.)

Ví dụ: "Vòng Tay Chu Sa — Score 76, phong thủy luôn hot trên TikTok, gợi ý 3 video"

**Buổi trưa — Tìm sản phẩm mới**
- Upload file FastMoss mới nhất tại trang **Sync**
- Hoặc paste link sản phẩm thấy tiềm năng vào **Inbox**
- AI chấm điểm tự động, sắp xếp theo score

**Buổi chiều — Sản xuất video**
- Vào **Sản xuất** → chọn sản phẩm → **Tạo Brief AI**
- Brief gồm: 3 hooks mở đầu, script chi tiết, góc quay gợi ý, hashtags
- Quay video theo brief

Ví dụ brief:
```
Hook 1: "Bạn có biết vòng chu sa ngũ lộ là gì không?"
Hook 2: "Mình mới mua cái này 49k mà người quen hỏi han suốt"  
Hook 3: "POV: Khi bạn đeo vòng phong thủy đi làm..."
Script: [15-30 giây] Mở bằng hook → Unbox/show sản phẩm → Highlight 2-3 điểm nổi bật → CTA "Link ở bio"
```

**Buổi tối — Log & Review**
- Vào **Log** → ghi nhận video đã quay (link video, sản phẩm, trạng thái)
- Dữ liệu log giúp AI học: video nào hiệu quả, sản phẩm nào bán tốt

---

### 3. Dashboard

Trang chính khi mở app. Gồm:

**Morning Brief** — AI tóm tắt tình hình mỗi ngày: sản phẩm nên quay, sự kiện sắp tới, phân tích nhanh. Click 🔄 để tạo lại brief.

**Thêm sản phẩm nhanh** — Dán link TikTok Shop / FastMoss → sản phẩm tự động vào Inbox và được chấm điểm.

**Nên tạo content** — Top sản phẩm score cao nhất chưa có brief. Click "Tạo Brief →" để bắt đầu.

**Inbox Pipeline** — Tổng quan: bao nhiêu SP mới, đã xử lý, đã brief.

**Sắp tới** — Lịch sự kiện (Mega Sale, ngày lễ) để chuẩn bị content trước.

---

### 4. Inbox

Nơi quản lý tất cả sản phẩm. 

**Thêm sản phẩm bằng link:**
Dán 1 hoặc nhiều link (mỗi link 1 dòng):
- Link TikTok Shop: `https://shop.tiktok.com/view/product/...`
- Link FastMoss: `https://www.fastmoss.com/zh/e-commerce/detail/...`
- Link video TikTok: `https://www.tiktok.com/@user/video/...`

**Score là gì?**
AI chấm điểm 1-100 dựa trên:
- Giá bán & commission (cao hơn = điểm cao)
- Số lượng bán (volume)
- Rating & reviews
- Xu hướng thị trường
- Phù hợp với nội dung TikTok

Callout box (bg-emerald-50):
```
✅ Khuyến nghị: Ưu tiên sản phẩm score > 70. Dưới 50 thường không đáng quay video.
```

**Filter & Sort:**
- Lọc theo score, danh mục, ngày thêm
- Sắp xếp theo score cao → thấp

---

### 5. Sync (Đồng bộ dữ liệu)

**Upload FastMoss:**
- Vào FastMoss → Export danh sách sản phẩm → Download file XLSX
- Kéo thả file vào trang Sync
- App tự nhận diện cột, map dữ liệu, import sản phẩm
- Hỗ trợ: .csv, .xlsx, .xls

**Upload TikTok Studio Analytics:**
- Vào TikTok Studio → Analytics → Export
- Kéo thả nhiều file cùng lúc (Content.xlsx, Overview.xlsx, FollowerActivity.xlsx)
- Data analytics giúp AI hiểu audience và tối ưu brief

Callout box (bg-amber-50):
```
💡 Tip: Upload FastMoss mỗi ngày để data luôn mới nhất. Sản phẩm trending thay đổi nhanh.
```

---

### 6. Sản xuất

Nơi tạo content brief bằng AI.

**Quy trình:**
1. Chọn sản phẩm (từ Inbox hoặc click "Tạo Brief →" ở Dashboard)
2. Click **Tạo Brief AI**
3. AI generate:
   - 3 hooks mở đầu (câu đầu tiên trong video)
   - Script chi tiết (15-60 giây)
   - Góc quay/angle gợi ý
   - Hashtags phù hợp
   - CTA (kêu gọi hành động)
4. Đọc brief → chọn hook → quay video

**Mẹo tạo brief hay:**
- Dùng model Sonnet 4.5 hoặc Opus 4.6 cho brief sáng tạo hơn
- Tạo nhiều brief cho cùng 1 SP → chọn brief hay nhất
- Kết hợp hook AI gợi ý với ý tưởng của mình

---

### 7. Log

Ghi nhận video đã sản xuất.

**Thông tin cần log:**
- Sản phẩm đã quay
- Link video TikTok (sau khi đăng)
- Trạng thái: đã quay / đã đăng / đang edit
- Ghi chú cá nhân

**Tại sao log quan trọng?**
Data từ log giúp AI:
- Biết sản phẩm nào bạn đã quay (không gợi ý lại)
- Học pattern: loại SP nào bạn hay chọn
- Tính toán năng suất (videos/ngày, videos/tuần)

---

### 8. Insights

Trung tâm phân tích AI.

**Tổng quan** — Số liệu chính: tổng SP, shop đánh giá, thu chi tháng, sự kiện sắp tới.

**Thu chi** — Theo dõi thu nhập affiliate và chi phí (quảng cáo, tools, v.v.). Tính lợi nhuận tự động.

**Lịch sự kiện** — Mega Sale, ngày lễ, campaign. Thêm sự kiện tùy chỉnh.

**Feedback** — Đánh giá kết quả: video nào hiệu quả, SP nào bán tốt/tệ.

**Learning** — AI học từ feedback. Chạy Learning để cập nhật trọng số chấm điểm.

**Playbook** — Bài học tổng hợp: chiến lược nào thắng, thua, insight.

Callout box (bg-orange-50):
```
💡 Quy trình Learning: Log video → Ghi feedback (bán tốt/tệ) → Chạy Learning → AI cập nhật score → Brief ngày mai chính xác hơn
```

---

### 9. Cấu hình AI khuyến nghị

3 preset tùy nhu cầu:

**⚡ Nhanh & Tiết kiệm** — Cho người mới bắt đầu, test thử
| Tác vụ | Model | Chi phí |
|--------|-------|---------|
| Chấm điểm SP | Haiku 4.5 | ~$0.001/SP |
| Tạo Brief | Haiku 4.5 | ~$0.002/brief |
| Morning Brief | Haiku 4.5 | ~$0.003/ngày |
| Báo cáo tuần | Haiku 4.5 | ~$0.005/tuần |
| **Tổng ước tính** | | **~$2-5/tháng** |

**⚖️ Cân bằng** — Khuyến nghị cho sử dụng hàng ngày
| Tác vụ | Model | Chi phí |
|--------|-------|---------|
| Chấm điểm SP | Haiku 4.5 | ~$0.001/SP |
| Tạo Brief | **Sonnet 4.5** | ~$0.01/brief |
| Morning Brief | Haiku 4.5 | ~$0.003/ngày |
| Báo cáo tuần | **Sonnet 4.5** | ~$0.02/tuần |
| **Tổng ước tính** | | **~$10-15/tháng** |

**🎯 Chất lượng tốt nhất** — Brief hay nhất, phân tích sâu nhất
| Tác vụ | Model | Chi phí |
|--------|-------|---------|
| Chấm điểm SP | **Sonnet 4.5** | ~$0.005/SP |
| Tạo Brief | **Opus 4.6** | ~$0.05/brief |
| Morning Brief | **Sonnet 4.5** | ~$0.01/ngày |
| Báo cáo tuần | **Opus 4.6** | ~$0.08/tuần |
| **Tổng ước tính** | | **~$30-50/tháng** |

Callout box (bg-emerald-50):
```
✅ Khuyến nghị: Bắt đầu với preset "Cân bằng". Chấm điểm dùng Haiku (nhanh, rẻ, đủ chính xác). Tạo Brief dùng Sonnet (sáng tạo hơn đáng kể). Nâng lên Opus khi cần brief đặc biệt hay.
```

**So sánh model:**
| Model | Tốc độ | Sáng tạo | Giá | Phù hợp |
|-------|--------|----------|-----|---------|
| Haiku 4.5 | ⚡⚡⚡ | ⭐⭐ | 💰 | Scoring, tóm tắt |
| Sonnet 4.5 | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | Brief hàng ngày |
| Opus 4.6 | ⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | Brief chất lượng cao |
| GPT-4o | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | Đa năng |
| GPT-4o-mini | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | Thay thế Haiku |
| Gemini 2.0 Flash | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | Nhanh |
| Gemini 2.5 Pro | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | Phân tích |

---

### 10. FAQ & Troubleshooting

**Q: Score chấm không chính xác?**
Score ban đầu dựa trên data sản phẩm. Càng log nhiều feedback (bán tốt/tệ), AI càng học và score chính xác hơn. Chạy **Learning** trong Insights sau khi có 10+ feedback.

**Q: Brief AI không hay, quá chung chung?**
- Đổi model sang Sonnet 4.5 hoặc Opus 4.6 tại Cài đặt
- Sản phẩm có mô tả chi tiết hơn → brief hay hơn

**Q: Upload FastMoss bị lỗi?**
- Đảm bảo file đúng format (.xlsx, .csv, .xls)
- File phải có các cột: tên SP, giá, link ảnh, commission
- Thử export lại từ FastMoss

**Q: Morning Brief không load?**
- Kiểm tra API key tại Cài đặt → phải hiện ✅ Đã kết nối
- Kiểm tra có sản phẩm trong Inbox không (cần ít nhất 1 SP)

**Q: Trang trắng / lỗi 500?**
- Kiểm tra API key còn hạn không
- Thử refresh trang (Ctrl+R)
- Nếu vẫn lỗi: vào Cài đặt → test lại kết nối

**Q: Chi phí AI quá cao?**
- Chuyển về preset "Nhanh & Tiết kiệm" (tất cả Haiku)
- Chỉ dùng Sonnet/Opus cho task "Tạo Brief"
- Giảm số brief tạo mỗi ngày

---

### 11. Tips & Tricks

- 📦 **Upload FastMoss mỗi ngày** — Data fresh = gợi ý chính xác hơn
- 🎯 **Ưu tiên score > 70** — Dưới 50 thường không đáng quay
- 🔄 **Tạo 2-3 brief cho 1 SP** — Chọn brief hay nhất, kết hợp hooks
- 📝 **Log đều đặn** — Dù video fail cũng log → AI học từ cả thất bại
- 📅 **Xem lịch sự kiện** — Chuẩn bị content trước Mega Sale 3-5 ngày
- 💡 **Dùng hook câu hỏi** — "Bạn có biết...?" luôn tạo curiosity cao trên TikTok
- 🏪 **Đánh giá shop** — SP tốt nhưng shop tệ = tỷ lệ hoàn cao, tránh
- ⚡ **Haiku cho scoring, Sonnet cho brief** — Tiết kiệm 80% chi phí AI mà brief vẫn hay

---

## CẤU HÌNH KỸ THUẬT PAGE

- Route: `/guide`
- Metadata title: `Hướng dẫn sử dụng`
- Layout: TOC trái (w-56, sticky top-0, hidden trên mobile) + content phải (max-w-3xl, prose)
- Mobile: dropdown chọn section thay TOC
- TOC highlight active section bằng Intersection Observer
- Smooth scroll khi click TOC item
- Callout component: 3 variants (tip = amber, success = emerald, info = orange)
- Thêm `@tailwindcss/typography` cho prose styling
- Thêm "Hướng dẫn" vào sidebar: icon BookOpen, đặt giữa Insights và divider Settings
- SEO: `title: 'Hướng dẫn sử dụng | PASTR'`

Content viết bằng JSX trực tiếp (không cần MDX — single page, không thay đổi thường xuyên).

Build phải 0 errors. Commit: "feat: add guide page — GitBook-style user documentation"
