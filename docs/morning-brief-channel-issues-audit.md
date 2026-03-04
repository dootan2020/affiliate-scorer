# Morning Brief + Channel + Encoding — Audit Issues

> Ngày audit: 2026-03-05
> Dựa trên DB production + code thực tế

---

## Phần 1: Encoding audit

### 1.1 DB data thực tế

**TikTokChannel:**

| ID | name | voiceStyle | targetAudience | niche | contentMix |
|----|------|-----------|----------------|-------|------------|
| cmm8bfz2r... | Test Beauty Channel | casual | `N? 18-35, quan t�m skincare` | beauty_skincare | null |
| cmm8bg4cl... | Test Beauty Channel | casual | `Nu 18-35, quan tam skincare` | beauty_skincare | null |

**CharacterBible (cmm8bng1a...):**

| Field | Value | Vấn đề |
|-------|-------|--------|
| coreValues | `["Skincare la khoa hoc","Tu nhien la nhat","Kien nhan la chia khoa"]` | ❌ Mất dấu |
| catchphrases | `["Da dep la niem vui","Skincare khong phai xa xi"]` | ❌ Mất dấu |
| redLines | `["Khong quang cao san pham gia","Khong copy bai nguoi khac"]` | ❌ Mất dấu |
| voiceDna | `{"pace":"Vua phai","tone":"Than thien","signature":"Hay cuoi khi noi"}` | ❌ Mất dấu |

### 1.2 Phân tích nguyên nhân

**Channel 1 (cmm8bfz2r):** `"N? 18-35, quan t�m skincare"` — ký tự `ữ` bị thay bằng `?` và `â` bị thay bằng `�`. Đây là **mojibake** — data UTF-8 bị decode sai encoding (có thể Latin-1 hoặc Windows-1252) khi lưu vào DB.

**Channel 2 (cmm8bg4cl):** `"Nu 18-35, quan tam skincare"` — dấu bị **stripped hoàn toàn**. Tất cả ký tự tiếng Việt bị loại dấu: `Nữ→Nu`, `quan tâm→quan tam`.

**CharacterBible:** Cùng pattern stripped dấu — `"Skincare là khoa học"→"Skincare la khoa hoc"`.

### 1.3 Root cause investigation

**Form/UI encoding:** `app/layout.tsx:49` có `<html lang="vi">`, font `Be_Vietnam_Pro` include `subsets: ["latin", "vietnamese"]`. Next.js tự thêm `<meta charset="utf-8">`. → **Form encoding OK.**

**API routes:** `app/api/channels/route.ts` và `app/api/channels/[id]/route.ts` dùng Zod validation + `JSON.parse` từ request body. Next.js API routes xử lý UTF-8 mặc định. → **API encoding OK.**

**AI generate:** `app/api/channels/generate/route.ts` — kênh được tạo bằng AI (field `generatedByAi: true`). AI model (Gemini) trả response JSON → **có thể AI model không output tiếng Việt có dấu** nếu prompt bằng tiếng Anh hoặc model lite.

**Kết luận:** Root cause **không phải** encoding HTML/API. Root cause là **AI generation output tiếng Việt không dấu** — Gemini 2.5 Flash Lite khi generate channel profile có thể:
1. Output tiếng Việt không dấu (Channel 2 + CharacterBible)
2. Output lẫn encoding (Channel 1 — có thể response chứa UTF-8 bytes bị serialize sai)

### 1.4 Records bị ảnh hưởng

| Table | ID | Fields bị lỗi |
|-------|----|---------------|
| TikTokChannel | cmm8bfz2r | targetAudience (mojibake) |
| TikTokChannel | cmm8bg4cl | targetAudience (stripped dấu) |
| CharacterBible | cmm8bng1a | coreValues, catchphrases, redLines, voiceDna (tất cả stripped dấu) |

### 1.5 Đề xuất fix

1. **Immediate:** SQL UPDATE trực tiếp sửa data bị lỗi cho 3 records
2. **Prevent:** Thêm instruction vào AI channel generate prompt: `"QUAN TRỌNG: Tất cả text tiếng Việt PHẢI có đầy đủ dấu (ă, â, đ, ê, ô, ơ, ư, à, á, ả, ã, ạ, v.v.). KHÔNG ĐƯỢC viết tiếng Việt không dấu."`
3. **Validate:** Thêm post-processing check sau AI response — nếu phát hiện text dài >10 ký tự mà không có dấu tiếng Việt → log warning

---

## Phần 2: Content Mix UX audit

### 2.1 Form có field contentMix?

✅ **CÓ** — đầy đủ ở tất cả layers:

| Layer | File | Chi tiết |
|-------|------|----------|
| Form UI | `components/channels/channel-profile-preview.tsx:253-260` | 5 sliders (review, lifestyle, tutorial, selling, entertainment) max=100 |
| Manual form | `components/channels/channel-manual-form.tsx:28` | Default: `{review:20, lifestyle:20, tutorial:30, selling:20, entertainment:10}` |
| Validation | `components/channels/channel-form.tsx:169-175` | Check total = 100% |
| API create | `app/api/channels/route.ts:32` | `z.record(z.string(), z.number()).optional()` |
| API update | `app/api/channels/[id]/route.ts:25` | `z.record(z.string(), z.number()).nullable().optional()` |
| DB schema | `prisma/schema.prisma:931` | `contentMix Json?` |
| Types | `lib/content/channel-profile-types.ts` | ContentMix type with 5 categories: review, lifestyle, tutorial, selling, entertainment |

### 2.2 Tại sao cả 2 kênh hiện contentMix = null?

Kênh được tạo bằng **AI generate** — AI output có thể đã không include `contentMix` field, hoặc field bị nullable và AI không generate value.

### 2.3 Widget warning link

`components/dashboard/content-suggestions-widget.tsx:81-85`:
```
"Kênh chưa cấu hình content mix — Cài đặt"
→ Link: /channels/{channelId}
```
Link đúng — dẫn tới channel detail page. User click → thấy tab "Tổng quan" → click "Sửa" → form có sliders contentMix.

**UX gap:** Link dẫn tới channel detail page nhưng user phải tự click "Sửa" rồi tìm contentMix sliders. **Nên link trực tiếp** tới edit mode: `/channels/{id}?edit=true` hoặc scroll tới section contentMix.

### 2.4 Đề xuất

- Link "Cài đặt" nên append `?edit=true` để auto-open edit mode
- Hoặc: nếu kênh tạo bởi AI, auto-fill contentMix default values khi AI không trả

---

## Phần 3: Morning Brief token waste audit

### 3.1 Empty sections trong prompt

Khi data rỗng (hiện tại: patterns=0, weights=0, goals=0, metrics published=0), prompt vẫn inject:

| Section | Khi rỗng inject | Tokens ước tính |
|---------|-----------------|-----------------|
| `LEARNING INSIGHTS` | `"Hook tốt nhất: chưa có data\nFormat tốt nhất: chưa có data\nCategory mạnh: chưa có"` | ~25 tokens |
| `WINNING PATTERNS` | `"Chưa phát hiện pattern"` | ~8 tokens |
| `PATTERNS NÊN TRÁNH` | `"Chưa có"` | ~5 tokens |
| `MỤC TIÊU TUẦN` | `"Chưa đặt mục tiêu"` | ~8 tokens |
| `KẾT QUẢ HÔM QUA` | `"Videos đăng: 0\nTổng views: 0\nReward trung bình: 0.0"` | ~15 tokens |
| `SẢN PHẨM ĐÃ CÓ BRIEF` | `"Không có"` | ~5 tokens |
| `SP CHƯA PHÂN KÊNH` | `"Không có"` | ~5 tokens |
| **Tổng waste** | | **~71 tokens** |

**Đánh giá: KHÔNG ĐÁNG LO.** 71 tokens trên budget 3000 = 2.4%. Bỏ qua.

**Tuy nhiên**, khi data **đầy đủ** (nhiều kênh, nhiều SP, Character Bible dài, nhiều patterns), prompt có thể vượt input token limit:
- 3 kênh × ~150 tokens/kênh context = 450 tokens
- 3 kênh × 5 SP × ~30 tokens/SP = 450 tokens
- Character Bible × 3 kênh = ~300 tokens
- Patterns 5 lines = ~150 tokens
- JSON template = ~400 tokens
- System prompt = ~200 tokens
- **Total estimate: ~2,200 input tokens**

Token limit 3000 là **output** limit. Input limit phụ thuộc model (Gemini Flash Lite context ~100K). → **Output 3000 tokens đủ cho V2 JSON response.**

### 3.2 Cron waste

Cron 6h sáng: 1 AI call/ngày × ~$0.001-0.003/call (Gemini Flash Lite) = **$0.03-0.09/tháng**. **Không đáng lo.** Brief sẵn khi user mở app = UX tốt hơn nhiều.

Nếu muốn tiết kiệm: skip cron nếu không có SP mới (check `ProductIdentity.count where inboxState in [scored, enriched]` = 0 → skip). Nhưng overhead implementation > savings.

---

## Phần 4: Morning Brief data freshness

### 4.1 Stale data scenarios

| Scenario | Stale? | Impact |
|----------|--------|--------|
| Import FastMoss 10h sáng | ✅ Brief 6h không biết SP mới | Medium — SP mới không trong brief |
| Log kết quả video 14h | ✅ yesterday_recap outdated | Low — recap hôm qua, không hôm nay |
| Tạo kênh mới 9h | ✅ Brief không biết kênh mới | Medium — channel_tasks thiếu kênh |
| Calendar event thêm 11h | ✅ upcoming_events outdated | Low — rare action |

### 4.2 Đề xuất: badge "Data đã thay đổi"

**KHÔNG nên auto-refresh** vì:
- Brief đã cached, user đọc xong rồi → refresh mất context
- AI call tốn tiền dù nhỏ, mỗi event trigger = nhiều call/ngày
- User có nút Refresh rồi

**Nên:** Hiện badge subtle khi có event sau brief generation:
```
"⚡ Có dữ liệu mới từ lúc tạo brief — Tạo lại?"
```
Logic: compare `brief.generatedAt` với timestamp của event gần nhất (`import-completed`, `score-completed`, `channel-updated`). Nếu event > generatedAt → show badge.

Cách implement:
- Widget đã listen `onSuggestionEvent` (content-suggestions-widget.tsx) → Morning Brief widget cũng nên listen
- Khi event arrives + brief.generatedAt < now → set `staleFlag = true`
- Render badge nhỏ dưới header

---

## Phần 5: Channel detail page audit

### 5.1 Tab "Tổng quan" — data rendering

**File:** `components/channels/channel-detail-client.tsx:436-672`

| Section | Field | Rendering | Encoding |
|---------|-------|-----------|----------|
| Persona | personaName, personaDesc, targetAudience, subNiche, usp | InfoRow text | ⚠️ Shows mojibake/no-diacritics as-is |
| Phong cách | voiceStyle, editingStyle, fontStyle | Label mapping (VOICE_LABELS etc.) | ✅ Labels tiếng Việt |
| Màu sắc | colorPrimary, colorSecondary | Color swatch | ✅ OK |
| Thông tin | niche, isActive | Text | ✅ OK |
| Content Mix | contentMix | Progress bars with MIX_LABELS | ✅ OK (nhưng null → không hiện) |
| Content Pillars | contentPillars, contentPillarDetails | Tags + details | ✅ OK |
| Hooks | hookBank | Numbered list | ⚠️ Nếu AI generate không dấu → hiện không dấu |
| Video Formats | videoFormats | Grid cards | ⚠️ productionNotes có thể không dấu |
| Posting Schedule | postsPerDay, postingSchedule | Grid by day | ✅ OK |
| CTA Templates | ctaTemplates | Cards by type | ⚠️ Nếu AI generate không dấu |
| Competitors | competitorChannels | List | ✅ OK (handle, followers tiếng Anh) |

### 5.2 Hardcode tiếng Anh?

Không. Tất cả labels đã tiếng Việt:
- Tab names: "Tổng quan", "Nhân vật", "Định dạng", "Ý tưởng", "Cẩm nang video", "Chuỗi nội dung"
- Section titles: "Persona", "Phong cách", "Màu sắc", "Thông tin", "Tỷ lệ nội dung"...
- Buttons: "Sửa", "Xoá", "Tải", "Làm mới", "Tạm dừng"
- Stats: "Tổng nội dung", "Lịch đăng", "Bản tóm tắt", "Cập nhật lần cuối"
- Error/empty: "Không tìm thấy kênh", "Lỗi tải kênh", "Lỗi kết nối"

**Ngoại lệ nhỏ:** `AI: {d.aiFeasibility}` ở line 516 hiện `"AI: high"`, `"AI: medium"`, `"AI: low"` — tiếng Anh. Nên map: high→Cao, medium→Trung bình, low→Thấp.

### 5.3 Responsive

- Stats grid: `grid-cols-2 sm:grid-cols-4` ✅
- Info grid: `grid-cols-1 md:grid-cols-2` ✅
- Schedule grid: `grid-cols-3 sm:grid-cols-4 md:grid-cols-7` ✅ (có `overflow-x-auto`)
- Header buttons: flex wrap implicit ✅
- Tab nav: flex items gap-1 → mobile sẽ overflow horizontally nếu 6 tabs ⚠️

**Tab nav issue:** 6 tabs ("Tổng quan", "Nhân vật", "Định dạng", "Ý tưởng", "Cẩm nang video", "Chuỗi nội dung") trong `flex` container **không có overflow scroll** → trên mobile <375px một số tab bị cắt. Nên thêm `overflow-x-auto` cho nav.

---

## Phần 6: Các vấn đề tiềm ẩn khác

### 6.1 AI model cho Morning Brief

**Model:** `gemini-2.5-flash-lite-preview-09-2025`

**Tiếng Việt:** Gemini Flash Lite handle tiếng Việt **OK nhưng không tốt bằng Gemini Pro** hoặc Claude. Với Morning Brief (output ~500-800 tokens, structured JSON), Flash Lite đủ dùng. Rủi ro: occasional lỗi ngữ pháp, viết không tự nhiên.

**Đề xuất:** Giữ nguyên Flash Lite cho daily brief (chi phí thấp). Nếu chất lượng output kém → switch sang Gemini 2.0 Flash hoặc Claude Haiku.

### 6.2 System prompt language

System prompt viết **tiếng Việt** (`generate-morning-brief.ts:13-19`): `"Bạn là AI thư ký cho affiliate marketer TikTok Việt Nam..."`. ✅ Đúng. AI sẽ output tiếng Việt.

User prompt cũng tiếng Việt: `"Tạo Morning Brief cho ngày..."`. ✅ OK.

### 6.3 BriefContent V2 backward compatibility

Widget xử lý V2 backward compat:

```typescript
const hasV2 = content?.channel_product_match && content.channel_product_match.length > 0;
```

- `hasV2 = true` → render `ChannelProductMatchSection` (grouped by channel)
- `hasV2 = false` → render `produce_today` flat list (V1)
- `event_product_boost` exists → render `EventProductBoostSection`, else V1 `upcoming_events`
- `pattern_highlight` exists → render `PatternHighlightCard`, else skip

✅ **Backward compatible.** Brief cũ (trước V2) render bình thường.

### 6.4 Nút Refresh — debounce?

`morning-brief-widget.tsx:40-58`: `fetchBrief(refresh)` set `refreshing=true` → button `disabled={refreshing || loading}`.

✅ **Có debounce implicit** — button disabled khi đang refreshing. User không thể spam click. Mỗi click = 1 AI call, button disabled cho tới khi complete.

**Tuy nhiên:** Nếu user mở 2 tabs → 2 refresh cùng lúc. Nhưng `upsert` by `briefDate` → chỉ 1 record cuối cùng survive. Waste 1 AI call. **Acceptable.**

### 6.5 Error handling

**AI call fail:**
- `generate-morning-brief.ts:130-136`: try/catch → fallback BriefContent với `greeting: "Chào buổi sáng!"`, `tip: "Thử lại sau"`
- Widget nhận response (200 OK with fallback content) → render fallback brief

**API fail (non-200):**
- `morning-brief-widget.tsx:46-48`: `!res.ok` → throw Error → `setError(message)`
- Widget render error state: AlertCircle + error message + "Thử lại" button

**Network fail:**
- `fetchWithRetry` (lib/utils/fetch-with-retry.ts): retry 3 lần (502/503/504) with exponential backoff (1s, 2s)
- Sau 3 retries fail → throw → widget error state

✅ **Error handling đầy đủ.** Không crash, có retry, có fallback content.

---

## Tổng hợp — Severity ranking

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | **Encoding: AI generate tiếng Việt không dấu** | 🔴 High | ✅ Fixed |
| 2 | **Tab nav overflow mobile** — 6 tabs bị cắt trên <375px | 🟡 Medium | ⏳ Pending |
| 3 | **contentMix null** — kênh "Test Beauty Channel" không có contentMix | 🟡 Medium | ✅ Form + link fixed |
| 4 | **Brief stale after import** — brief 6h outdated khi import 10h | 🟡 Medium | ✅ Fixed |
| 5 | **AI feasibility label English** — "AI: high" thay vì "AI: Cao" | 🟢 Low | ⏳ Pending |
| 6 | **Token waste khi empty data** — 71 tokens rỗng | 🟢 Low | ✅ Fixed |
| 7 | **Cron daily cost** — $0.03-0.09/tháng | 🟢 Low | Acceptable |

---

## Phần 7: Implementation Log (Task 18)

> Ngày fix: 2026-03-05

### 7.1 R1: Encoding fix — ✅ DONE

**DB data fix (scripts/db-query-encoding.ts):**
- Channel `cmm8bg4cl`: targetAudience `"Nu 18-35, quan tam skincare"` → `"Nữ 18-35, quan tâm skincare"`, personaDesc `"Co nang 25 tuoi yeu skincare"` → `"Cô nàng 25 tuổi yêu skincare"`
- CharacterBible `cmm8bng1a`: coreValues, catchphrases, redLines restored with proper diacritics

**Root cause prevention:**
- `lib/content/generate-channel-profile.ts:110`: Added explicit diacritics instruction: `"Tất cả bằng tiếng Việt CÓ DẤU đầy đủ ... KHÔNG được viết không dấu"`
- `lib/content/generate-character-bible.ts:74`: Added: `"Tiếng Việt tự nhiên CÓ DẤU đầy đủ ... KHÔNG viết không dấu (VD: sai 'Skincare la khoa hoc' → đúng 'Skincare là khoa học')"`

### 7.2 R2: Content Mix UX — ✅ DONE

**Trước:** Widget "Cài đặt" link → `/channels/{id}` → user phải click "Sửa" → tìm contentMix sliders
**Sau:**
- `channel-detail-client.tsx`: Added `useSearchParams` — `?edit=true` auto-opens edit mode
- `content-suggestions-widget.tsx`: Widget link updated → `/channels/{id}?edit=true`
- Form contentMix sliders đã có sẵn (channel-profile-preview.tsx + channel-manual-form.tsx)

### 7.3 R3: Token optimization — ✅ DONE

**Trước:** `buildPrompt()` always inject placeholder text for empty sections (~71 tokens waste)
**Sau:** `brief-prompt-builder.ts` refactored — empty sections skipped entirely:
- Skip `SP CHƯA PHÂN KÊNH` when no unmatched products
- Skip `SẢN PHẨM ĐÃ CÓ BRIEF` when no briefed products
- Skip `SỰ KIỆN SẮP TỚI` when no events
- Skip `KẾT QUẢ HÔM QUA` when no yesterday activity (published=0, views=0)
- Skip `LEARNING INSIGHTS` when all fields = "chưa có"
- Skip `WINNING PATTERNS` / `PATTERNS NÊN TRÁNH` when empty
- Skip `MỤC TIÊU TUẦN` when no goal set

**Token savings estimate:** ~150-200 tokens when data empty. When data full, prompt still fits within 3000 token output limit.

### 7.4 R4: Data freshness badge — ✅ DONE

**API change:** `app/api/brief/today/route.ts` — response now includes `latestDataChange` timestamp (latest `ProductIdentity.updatedAt`)

**Widget change:** `morning-brief-widget.tsx`:
- New state: `isStale` — compares `latestDataChange` with `brief.generatedAt`
- When stale: renders amber badge `"Data mới — Tạo lại?"` next to refresh button
- Badge is clickable → triggers refresh
- After refresh: `isStale` resets to false

**No auto-refresh** — user decides. Saves AI calls.
