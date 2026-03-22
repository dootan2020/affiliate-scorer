# PASTR

Paste links. Ship videos. Learn fast. Công cụ AI sản xuất video affiliate TikTok.

## Cài đặt

```bash
pnpm install
cp .env.example .env      # Điền ENCRYPTION_KEY + DATABASE_URL + DIRECT_URL
pnpm prisma migrate deploy # Chạy migration (lần đầu)
pnpm dev                   # Mở http://localhost:3000
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | - | Direct connection (Supabase pooling) |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key cho mã hóa API keys |
| `AUTH_SECRET` | - | Secret cho auth sessions |
| `TELEGRAM_BOT_TOKEN` | - | Telegram bot (optional) |

> API keys (Anthropic, OpenAI, Google AI) được quản lý qua **Settings > API Keys** trong UI. Xem `docs/deployment-guide.md` cho danh sách đầy đủ.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: PostgreSQL (Supabase) + Prisma ORM (51 models)
- **AI**: Claude / GPT / Gemini (multi-provider, encrypted DB keys)
- **UI**: Tailwind CSS, Radix UI, Recharts, Lucide Icons
- **Theme**: next-themes (light/dark auto)
- **Version**: v1.10.1 (Mar 22, 2026)
- **Production Readiness**: 85/100
- **Live URL**: https://pastr-app.netlify.app
