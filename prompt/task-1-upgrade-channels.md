Đọc 2 file spec sau:
- docs/ai-kol-koc-spec.md
- docs/build-character-full.md

Đây là framework xây dựng AI KOL/KOC với Character Bible 7 tầng, Consistency Locks, Content Engine 10 format, và QC pipeline. Mục tiêu là tích hợp framework này vào PASTR để content sinh ra nhất quán theo nhân vật kênh, bền vững dù sản phẩm thay đổi.

/plan:hard "Character-Driven Content System — Nâng cấp hệ thống sinh content từ product-centric sang character-driven

## Vấn đề hiện tại

1. Content Brief generation hiện chỉ dựa vào dữ liệu sản phẩm. Mỗi brief sinh ra độc lập, không có personality layer → script giữa các sản phẩm khác nhau không có giọng nói thống nhất.

2. TikTokChannel có trường persona và voiceStyle nhưng quá sơ sài — chỉ là text ngắn, không đủ depth để AI sinh content nhất quán qua hàng trăm video.

3. Không có Format Bank — AI tự do chọn cách viết script, dẫn đến kênh không có nhịp content đều đặn và nhận diện được.

4. Compliance Check hiện chỉ kiểm tra TikTok VN rules, chưa kiểm tra character consistency (đúng giọng, đúng catchphrase, đúng visual locks).

## Kết quả cần đạt được

### R1: Character Bible Storage
- Mỗi TikTokChannel lưu được đầy đủ Character Bible 7 tầng: Core Belief/Fear/Red Lines, Relationship Web, World Rules, Origin Story, Living Space, Story Arc 12 tuần, Language/Ritual
- Lưu được Consistency Locks: 5 Visual Locks + Voice DNA
- Có UI để nhập/sửa từng tầng, có thể generate bằng AI từ mô tả ngắn
- Khi tạo channel mới, có option 'Generate Character Bible' từ thông tin cơ bản (ngách + persona + tệp mục tiêu)

### R2: Format Bank
- Mỗi channel có bộ format riêng (mặc định 10 format từ spec: Review, Myth-bust, A vs B, Checklist, Story, Test, React, Mini Drama, Series Challenge, Deal Breakdown)
- Mỗi format lưu: tên, cấu trúc (Hook → Body → Proof → CTA), ví dụ script mẫu, mục tiêu (awareness/lead/sale)
- Khi generate Content Brief, AI phải chọn format phù hợp từ bank, không tự do sáng tạo ngoài bank
- User có thể thêm/sửa/xóa format

### R3: Character-Aware Brief Generation
- Prompt AI khi generate brief phải inject: Character Bible (beliefs, voice DNA, catchphrases, red lines) + Format được chọn + Sản phẩm data
- Script sinh ra phải đúng giọng nhân vật, có catchphrase, đúng format structure
- Nếu channel chưa có Character Bible → fallback về behavior hiện tại, không break

### R4: Consistency QC Layer
- Sau khi sinh script, chạy 1 bước QC tự động kiểm tra:
  - Có chứa ít nhất 1 catchphrase của channel không
  - Hook ≤ 15 từ (≈ 2 giây)
  - Có proof/evidence section không
  - CTA có đúng keyword pattern của channel không
  - Không vi phạm Red Lines
- Kết quả QC hiển thị badge PASS/WARN trên mỗi script
- WARN không block, chỉ highlight để user review

### R5: Idea Matrix
- Từ Character Bible 7 tầng × Format Bank → sinh Idea Matrix tự động
- Mỗi ô = 1 content idea có sẵn hook gợi ý
- User chọn idea từ matrix → generate brief → vào production pipeline như bình thường
- Matrix refresh được (AI sinh thêm ideas mới dựa trên learning data)

## Ràng buộc
- Không break flow hiện tại — mọi thứ backward compatible, channel không có Character Bible vẫn hoạt động bình thường
- Character Bible và Format Bank là optional enhancement, không bắt buộc
- Giữ đúng tech stack hiện tại: Prisma + PostgreSQL, Next.js App Router, multi-AI provider
- Tham khảo chi tiết 2 file spec để hiểu đúng cấu trúc 7 tầng, 10 format, QC checklist, consistency locks"