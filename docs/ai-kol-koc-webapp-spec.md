# SPEC WEBAPP: AI KOL/KOC Builder + Video Engine (Implement-ready)
*Bản spec để dev triển khai: data model, flows, UI, API, pipeline, permissions, safety, metrics. Ngách-agnostic (template), có chế độ AI-only và Hybrid.*

---

## 0) Mục tiêu sản phẩm
Webapp giúp người dùng:
1) **Tạo “AI Character IP”** (Character Bible 7 tầng + locks).
2) **Tạo “Video Bible”** (12 locks video) + **Shot/Scene Grammar**.
3) **Sinh content plan** (series/episodes/scripts/captions).
4) **Sản xuất video** theo pipeline (AI-only hoặc Hybrid).
5) **Phân phối + tracking** (đăng thủ công hoặc tích hợp, log metrics).
6) **Lặp tối ưu** (analytics → insights → regenerate).

---

## 1) Personas & Roles
### 1.1 Người dùng
- **Creator (solo):** tạo nhân vật, tạo nội dung, xuất video.
- **Team:** editor, content writer, reviewer.
- **Admin:** quản trị hệ thống, billing, policy.

### 1.2 RBAC (Role-Based Access Control)
- `owner`: full access
- `editor`: edit scripts/series/shotlist, upload assets
- `reviewer`: review/approve content, lock releases
- `viewer`: read-only

---

## 2) Tổng quan kiến trúc (high-level)
### 2.1 Modules chính
1) **Character Studio**: tạo nhân vật (7 tầng) + consistency locks.
2) **Video Studio**: Video Bible + shot library + scene templates.
3) **Content Factory**: format bank, idea matrix, series planner, script generator.
4) **Production Pipeline**: asset mgmt, storyboard, render jobs, QC.
5) **Publishing & CRM**: captions, hashtags, DM scripts, link hub, UTM.
6) **Analytics & Iteration**: metrics ingest, A/B tags, recommendations.
7) **Safety & Governance**: policy rules, disclaimers, audit log.

### 2.2 Data storage
- DB (Postgres/Supabase): structured entities.
- Object storage (S3/Supabase Storage): images, audio, video, thumbnails, JSON exports.
- Optional vector store: retrieval cho knowledge (brand docs, product notes) để viết script nhất quán.

### 2.3 AI services
- LLM: script, captions, idea generation, QA checks.
- TTS: voice generation (nếu cần).
- Video avatar/render: tùy stack (AI-only) hoặc chỉ generate assets + hướng dẫn quay (Hybrid).

---

## 3) Data Model (DB schema đề xuất)
> Dưới đây là mức “đủ để build” và dễ mở rộng.  

### 3.1 Core entities
#### `workspaces`
- `id`, `name`, `owner_user_id`, `plan`, `created_at`

#### `workspace_members`
- `workspace_id`, `user_id`, `role`, `created_at`

#### `characters`
- `id`, `workspace_id`, `name`, `short_bio`, `archetype`, `niche` (nullable), `status` (draft/active/archived)
- `created_at`, `updated_at`

#### `character_bible`
- `character_id`
- `core_beliefs` (jsonb array)
- `core_fear` (text)
- `red_lines` (jsonb array)
- `relationships` (jsonb: list nhân vật phụ)
- `world_rules` (jsonb)
- `origin_story` (jsonb: wound/vow/symbol + scenes)
- `living_space` (jsonb: scenes/props/texture)
- `story_arc` (jsonb: 12-week plan)
- `language_ritual` (jsonb: catchphrases/inside jokes/rituals)
- `version` (int), `locked` (bool)

#### `character_locks`
- `character_id`
- `visual_locks` (jsonb: face/hair/marks/palette/outfit)
- `voice_dna` (jsonb: pace, slang_level, signature_lines)
- `behavior_rules` (jsonb: do/dont, tone)
- `version`, `locked`

### 3.2 Video system
#### `video_bibles`
- `id`, `character_id`
- `visual_locks` (jsonb: framing, lighting, composition, color, edit_rhythm)
- `audio_locks` (jsonb: tts_voice_id?, sfx_pack, bgm_moods, room_tone)
- `narrative_locks` (jsonb: opening_ritual, proof_token_rule, closing_ritual)
- `ai_mode` (enum: `ai_only`, `hybrid`)
- `version`, `locked`, `created_at`

#### `shot_library`
- `id`, `video_bible_id`
- `shot_code` (A1/A2/B1...), `description`, `duration_hint`, `camera`, `notes`
- `asset_refs` (jsonb: optional example frames)

#### `scene_templates`
- `id`, `video_bible_id`
- `name`, `blocks` (jsonb: tension/reveal/proof/payoff/cta)
- `default_shot_sequence` (jsonb array of shot_codes)
- `rules` (jsonb: max_words, max_cuts, subtitle style)

### 3.3 Content planning
#### `formats`
- `id`, `workspace_id`
- `name`, `structure` (jsonb: hook/body/proof/cta), `best_for` (jsonb)
- `requires_proof` (bool), `recommended_ai_mode` (ai_only/hybrid/both)

#### `idea_bank`
- `id`, `workspace_id`, `character_id`
- `pillar` (enum: belief/rules/relationship/origin/living_space/arc/language)
- `format_id`, `idea`, `hook`, `tags` (jsonb), `score` (float nullable)
- `source` (manual/ai/import)

#### `series`
- `id`, `character_id`
- `name`, `type` (evergreen/signature/arc/community)
- `premise`, `opening_ritual`, `closing_ritual`, `proof_rule`
- `status` (draft/active/paused)

#### `episodes`
- `id`, `series_id`
- `title`, `goal` (awareness/lead/sale)
- `format_id`, `pillar`
- `script_id` (nullable), `shotlist_id` (nullable)
- `publish_plan` (jsonb: platform, date), `status` (draft/ready/rendered/published)

#### `scripts`
- `id`, `character_id`, `episode_id` (nullable)
- `language` (vi/en), `text`, `word_count`
- `hook`, `cta`, `disclaimer` (nullable)
- `ai_prompt_trace` (jsonb), `version`, `status` (draft/approved)

#### `captions`
- `id`, `episode_id`
- `text`, `hashtags` (jsonb), `cta_keyword` (nullable), `utm_params` (jsonb)

### 3.4 Production assets & jobs
#### `assets`
- `id`, `workspace_id`, `type` (image/audio/video/doc), `url`, `meta` (jsonb)
- `tags` (jsonb), `created_at`

#### `storyboards`
- `id`, `episode_id`
- `frames` (jsonb: list {shot_code, description, asset_id?})

#### `shotlists`
- `id`, `episode_id`
- `items` (jsonb: ordered list {shot_code, duration, action, notes})

#### `render_jobs`
- `id`, `episode_id`
- `mode` (ai_only/hybrid)
- `status` (queued/running/succeeded/failed)
- `provider` (text), `input_payload` (jsonb), `output_assets` (jsonb), `error` (text)
- `created_at`, `updated_at`

#### `qc_reviews`
- `id`, `episode_id`
- `status` (pass/fail/needs_fix)
- `checklist` (jsonb: per-rule pass/fail + notes)
- `reviewer_user_id`, `created_at`

### 3.5 Publishing & Analytics
#### `publishing_targets`
- `id`, `workspace_id`
- `platform` (tiktok/facebook/youtube), `account_label`, `auth_ref` (nullable)

#### `publish_logs`
- `id`, `episode_id`, `platform`, `published_at`, `url` (nullable)
- `status` (planned/published/failed)

#### `metrics_daily`
- `id`, `episode_id`, `date`
- `views`, `likes`, `comments`, `shares`, `saves`
- `avg_watch_time`, `completion_rate`, `ctr_bio`, `dm_rate`
- `raw` (jsonb)

#### `experiments`
- `id`, `episode_id`, `variant` (A/B), `notes`, `hypothesis`

### 3.6 Governance
#### `audit_logs`
- `id`, `workspace_id`, `user_id`, `action`, `entity`, `entity_id`, `meta` (jsonb), `created_at`

#### `policy_rules`
- `id`, `workspace_id` (nullable global)
- `name`, `severity` (info/warn/block)
- `pattern` (text/regex), `message`, `applies_to` (script/caption/video_meta)

---

## 4) UI/UX Spec (Screens & Components)
### 4.1 App Navigation
- Sidebar: **Characters**, **Video Bible**, **Content Factory**, **Production**, **Publishing**, **Analytics**, **Settings**

### 4.2 Characters
#### Screen: Character List
- Create, Duplicate, Archive
- Filter: status, archetype, niche (optional)

#### Screen: Character Studio (wizard + editor)
- Tabs: `7 tầng` | `Locks` | `Relationships` | `Exports`
- **Wizard mode** (điền form) + **Pro mode** (edit JSON)
- Button: **Lock v1** (khóa phiên bản để giữ consistency)

**Component highlights**
- `BibleFormSection` (reusable)
- `RelationshipGraph` (nodes/edges)
- `LockBadge` (locked/unlocked)

### 4.3 Video Bible
#### Screen: Video Bible Editor
- Toggle: `AI-only` / `Hybrid`
- 12 locks editor (visual/audio/narrative)
- Shot Library builder: add A1/A2/B1...
- Scene Templates: create templates (PASS/FAIL Lab, Myth-bust, Mini drama)

**Component highlights**
- `ShotCard` (shot_code, preview, notes)
- `SceneTemplateBuilder` (blocks + shot sequence)
- `SubtitleStylePicker` (font/size, safe-area)

### 4.4 Content Factory
#### Screen: Format Bank
- 10 format default + custom formats
- Each format: structure + recommended mode + requires proof

#### Screen: Idea Matrix
- Table: pillar × format
- Button: **Generate ideas** (AI) theo pillar/format
- Scoring: manual + AI score

#### Screen: Series Planner
- Create series: type, premise, rituals, proof rule
- Auto-generate 10–30 episodes: choose pillar distribution & goals
- Episode list: status, planned date, assigned script

### 4.5 Production
#### Screen: Episode Editor
- Sections:
  1) Objective (awareness/lead/sale)
  2) Script editor (with lint: word count, hook, CTA)
  3) Shotlist (auto from scene template)
  4) Storyboard (optional)
  5) Assets (upload/attach)
  6) QC checklist + request review
  7) Render job (AI-only) or Export pack (Hybrid)

**Hybrid Export Pack**
- Download zip: `script.txt`, `shotlist.json`, `caption.txt`, `broll_list.md`, `subtitle.srt` (optional)

### 4.6 Publishing
- Calendar view: planned episodes
- Post composer: caption + hashtags + CTA keyword + UTM
- Manual publish log (dán link video) hoặc API integration (nếu có)

### 4.7 Analytics
- Dashboard: top episodes, format performance, pillar performance
- Episode detail: metrics over time + notes
- Recommendations: “Scale format X”, “Hook too long”, “Proof missing”

---

## 5) Core Flows (User journeys)
### Flow 1: Tạo nhân vật (10 phút)
1) Create Character → Wizard 7 tầng  
2) Add Locks (visual/voice/behavior)  
3) Add 2–3 supporting characters  
4) Lock v1 → Active

### Flow 2: Tạo Video Bible (10 phút)
1) Choose mode: AI-only vs Hybrid  
2) Fill 12 locks (visual/audio/narrative)  
3) Create shot library + scene templates  
4) Lock v1

### Flow 3: Sinh series + episodes (5 phút)
1) Choose series type + premise  
2) Select formats + pillar distribution  
3) Generate 10 episodes  
4) Pick goals (awareness/lead/sale) ratios

### Flow 4: Sản xuất 1 episode (15–30 phút)
1) Generate script → edit  
2) Generate caption  
3) Auto shotlist from template  
4) QC lint + request review  
5a) AI-only: render job  
5b) Hybrid: export pack

### Flow 5: Publish + track
1) Mark published + URL  
2) Import metrics (manual/CSV/API)  
3) Weekly review recommendations

---

## 6) AI Prompts & Guardrails (Implement spec)
### 6.1 Prompt building blocks
- `system`: persona = Character Bible + locks (locked version)
- `style`: Video Bible narrative locks + subtitle rules
- `task`: generate scripts/captions/ideas/shotlist
- `constraints`: max words, 1 CTA, proof token required, red lines

### 6.2 Script generator requirements
Input:
- character_id + bible_version + locks_version
- video_bible_id + mode
- format_id + pillar + goal
- optional: product notes, user constraints

Output JSON (strict):
```json
{
  "hook": "...",
  "script": "...",
  "proof_token": {"type":"checklist|test|compare|source", "details":"..."},
  "cta": {"type":"comment_keyword|follow|link_bio", "value":"KỆ"},
  "disclaimer": null,
  "shot_template": "PASS_FAIL_LAB",
  "broll_list": ["...","..."],
  "keywords": ["..."]
}
```

### 6.3 Lint/QC AI checks
- Check hook length, 1 idea only, claims, banned words, missing proof
- Returns:
```json
{"score":0-100,"issues":[{"severity":"warn|block","message":"...","fix":"..."}]}
```

### 6.4 Safety rules
- Block: y tế/tài chính claim chắc chắn, cam kết lợi nhuận, nội dung thù ghét, thông tin cá nhân.
- Warn: “100%”, “chắc chắn”, “tốt nhất”, “bảo đảm” nếu không có proof.

---

## 7) Production Modes (AI-only vs Hybrid)
### 7.1 AI-only (Render)
- App tạo payload gửi provider (avatar/video gen)
- Job status + retries + store output to storage
- Generate subtitle file (SRT) từ script + timestamps (optional)

### 7.2 Hybrid (Export pack)
- App xuất: script + shotlist + storyboard (optional) + b-roll list + caption + subtitle
- Creator quay B-roll thật, ghép theo shotlist
- App hỗ trợ upload final video + QC checklist + publish log

---

## 8) API Spec (REST/Edge Functions)
> Ví dụ endpoints. Bạn có thể implement bằng Supabase Edge Functions hoặc Next.js API routes.

### 8.1 Characters
- `POST /api/characters`
- `GET /api/characters?workspace_id=...`
- `GET /api/characters/:id`
- `POST /api/characters/:id/lock` (lock bible/locks versions)

### 8.2 Video Bible
- `POST /api/video-bibles`
- `POST /api/video-bibles/:id/lock`
- `POST /api/video-bibles/:id/shot-library`

### 8.3 Content generation
- `POST /api/ai/generate-ideas`
- `POST /api/ai/generate-script`
- `POST /api/ai/generate-caption`
- `POST /api/ai/lint-script`

### 8.4 Production
- `POST /api/episodes`
- `POST /api/episodes/:id/generate-pack` (hybrid zip)
- `POST /api/render-jobs` (ai-only)
- `GET /api/render-jobs/:id`

### 8.5 Analytics
- `POST /api/metrics/import` (CSV/manual)
- `GET /api/analytics/dashboard?character_id=...`

---

## 9) Non-functional requirements
- **Consistency:** locked versions must be referenced in every generation call.
- **Traceability:** store ai_prompt_trace and audit logs.
- **Performance:** paginate episode lists; async render jobs.
- **Security:** RLS policies per workspace; signed URLs for assets.
- **Extensibility:** formats, pillars, templates are data-driven.

---

## 10) MVP Scope (2–3 tuần dev)
### Must-have
- Character Studio (7 tầng + locks + lock version)
- Video Bible (12 locks + 1–2 scene templates)
- Format bank (10 mặc định)
- Generate script + caption + shotlist (AI)
- Episode editor + Hybrid export pack
- Manual publish log + manual metrics input
- Basic analytics (top videos, format performance)

### Nice-to-have
- AI lint + QC workflow
- Render jobs (AI-only)
- Auto subtitle timing
- Integrations API publish

---

## 11) Acceptance Criteria (Definition of Done)
1) Tạo character → lock v1 → generate 10 scripts **nhất quán giọng**
2) Tạo video bible → shot template → generate shotlist **đúng cấu trúc blocks**
3) Export pack tạo đủ files, download 1 click
4) QC checklist chạy, có warn/block
5) Analytics hiển thị metrics theo episode và theo format

---

## 12) JSON Templates (để dev dùng ngay)
### 12.1 Character Bible (skeleton)
```json
{
  "core": {"beliefs": [], "fear": "", "red_lines": []},
  "relationships": [{"name":"","role":"","catchphrase":"","goal":""}],
  "world_rules": {"rules": [], "weaknesses": []},
  "origin": {"wound":"","vow":"","symbol":"","scenes":[]},
  "living_space": {"signature_scenes": [], "props": [], "texture": ""},
  "story_arc": {"weeks": [{"week":1,"theme":"","episodes":[]}]},
  "language_ritual": {"catchphrases": [], "inside_jokes": [], "rituals": []}
}
```

### 12.2 Video Bible (skeleton)
```json
{
  "mode": "hybrid",
  "visual_locks": {"framing":"","lighting":"","composition":"","palette":"","edit_rhythm":""},
  "audio_locks": {"voice_id":null,"sfx_pack":[],"bgm_moods":[],"room_tone":""},
  "narrative_locks": {"opening_ritual":"","proof_token_rule":"","closing_ritual":""}
}
```

---

## 13) Gợi ý tech stack (phù hợp webapp hiện đại)
- Frontend: Next.js/React + Tailwind/shadcn
- Auth/RBAC/DB/Storage: Supabase
- Jobs: Supabase Queues/cron hoặc worker riêng
- AI: OpenAI/Claude/Gemini (trừu tượng qua provider interface)
- Zip export: serverless function tạo zip từ templates + DB data

---

# Kết thúc
Nếu bạn cho mình biết stack hiện tại của webapp (Next.js hay Vite? Supabase hay Firebase?), mình có thể **chuyển spec này thành TODO dev tasks + DB migrations (SQL) + API contract chi tiết** theo đúng stack bạn đang dùng.
