# PASTR

Paste links. Ship videos. Learn fast. Công cụ AI sản xuất video affiliate TikTok.

## Cài đặt

```bash
pnpm install
cp .env.example .env   # Điền ENCRYPTION_KEY + DATABASE_URL
pnpm dev               # Mở http://localhost:3000
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | - | Direct connection (Supabase pooling) |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key cho mã hóa API keys |
| `AUTH_SECRET` | - | Secret cho auth sessions |

> API keys (Anthropic, OpenAI, Google AI) được quản lý qua **Settings > API Keys** trong UI.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: PostgreSQL (Supabase) + Prisma ORM (51 models)
- **AI**: Claude / GPT / Gemini (multi-provider, encrypted DB keys)
- **UI**: Tailwind CSS, Radix UI, Recharts, Lucide Icons
- **Theme**: next-themes (light/dark auto)
- **Version**: v1.10.0 (Mar 8, 2026)
- **Production Readiness**: 85/100
