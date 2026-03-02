Copy file spec vào docs trước:
copy "C:\Users\Admin\Downloads\AI_KOL_KOC_Webapp_Implement_Spec.md" docs\ai-kol-koc-webapp-spec.md

Sau đó đọc toàn bộ các file tham khảo:
- docs/ai-kol-koc-webapp-spec.md
- docs/ai-kol-koc-spec.md
- docs/build-character-full.md
- Prisma schema hiện tại
- Toàn bộ API routes, components, lib liên quan đến: channels, briefs, production, assets

Rồi lên kế hoạch và implement toàn bộ theo mô tả bên dưới. Không cần hỏi tôi, tự quyết định mọi thứ.

/cook --auto "Video Production System — Mở rộng PASTR từ script generator thành video production pipeline

## Bối cảnh
PASTR đã có Character Bible 7 tầng, Format Bank, Idea Matrix, Character-Aware Brief Generation, QC Layer. Luồng hiện tại dừng ở sinh script text. Cần mở rộng cover pipeline: script → chuẩn bị quay video → publish, giữ nhất quán nhân vật kênh.

3 file spec trong docs/ chứa framework chi tiết: data model, UI flows, API, AI prompts, production modes. Đọc kỹ và adapt cho PASTR.

## 5 vấn đề cần giải quyết

1. Không có Video Bible — script không kèm hướng dẫn visual/audio/narrative. Creator quay mỗi lần một kiểu, kênh mất nhất quán hình ảnh.

2. Không có Shot Library và Scene Templates — creator tự nghĩ cách quay, không có shot codes chuẩn hóa, không có template cảnh tái sử dụng.

3. Content rời rạc — không có Series concept có arc xuyên suốt. ProductionBatch chỉ group theo ngày, không có series 10 tập với premise.

4. Export Pack sơ sài — chỉ scripts.md + prompts.json + checklist.csv. Thiếu shotlist, caption, b-roll list, style guide.

5. Không có version locking — Character Bible có thể bị sửa giữa chừng, script cũ và mới không nhất quán.

## 5 kết quả cần đạt

### R1: Video Bible gắn với TikTokChannel
- 12 locks chia 3 nhóm: visual (framing, lighting, composition, palette, edit rhythm), audio (voice style, SFX, BGM, room tone), narrative (opening ritual, proof token rule, closing ritual)
- 2 mode: ai_only / hybrid
- Tab Video Bible trên channel detail page
- Generate Video Bible bằng AI từ Character Bible
- Inject Video Bible vào prompt khi generate brief

### R2: Shot Library + Scene Templates
- Shot codes (A1-Hook, A2-Close-up, B1-Test, B2-Result, C1-CTA...) gắn với Video Bible
- Scene Templates tái sử dụng (PASS/FAIL Lab, Myth-bust, A vs B, Mini Drama...)
- Mỗi template có blocks structure + default shot sequence + rules
- Khi generate script, AI đề xuất template + auto-generate shotlist

### R3: Series Planner + Episode System
- Series gắn với channel: name, type (evergreen/signature/arc/community), premise, rituals, status
- Episode gắn với series: title, goal, format, pillar, planned date, status
- AI generate 10-30 episodes từ series premise + Character Bible + Format Bank
- UI Series Planner trên Production page
- Episode liên kết ContentAsset hiện có

### R4: Enhanced Export Pack
- ZIP gồm: script.md, shotlist.json, caption.txt, broll-list.md, checklist.md
- Nếu có Video Bible: thêm style-guide.md
- Download 1 click từ episode hoặc production batch

### R5: Version Locking
- Character Bible + Video Bible có version (int) + locked (bool)
- Lock = snapshot data, không cho edit, phải tạo version mới
- Generate script phải reference bible_version + video_bible_version
- ContentBrief lưu version đã dùng
- UI nút Lock Version + version history

## Ràng buộc
- Backward compatible — channel không có Video Bible/Series vẫn chạy bình thường
- Giữ tech stack: Prisma + PostgreSQL, Next.js App Router, Tailwind + Radix UI
- Không thêm external services mới (không TTS, không video render)
- Focus Hybrid mode (export pack cho creator tự quay)
- kebab-case files, max 200 LOC/file, YAGNI/KISS/DRY
- Adapt data model từ spec cho Prisma schema hiện tại, không copy nguyên"