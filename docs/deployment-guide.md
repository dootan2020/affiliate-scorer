# Deployment Guide — PASTR (AffiliateScorer)

Complete guide for deploying PASTR to production on Netlify or Vercel.

---

## Table of Contents

1. [Netlify Deployment](#netlify-deployment)
2. [Vercel Deployment](#vercel-deployment)
3. [Environment Variables](#environment-variables)
4. [CI/CD Setup](#cicd-setup)
5. [Troubleshooting](#troubleshooting)

---

## Netlify Deployment

### Prerequisites

- Netlify account (free tier OK)
- GitHub repository connected
- Node.js 18+ (for local build testing)
- pnpm package manager

### Configuration

The project includes `netlify.toml` with Next.js optimization:

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

The `@netlify/plugin-nextjs` plugin is already in `devDependencies` (v5.15.8).

### Deployment Steps

#### Option A: Deploy via Netlify UI (Recommended)

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select GitHub repository (affiliate-scorer)
   - Authorize Netlify access

2. **Configure Build Settings**
   - **Build command:** `pnpm build` (auto-detected)
   - **Publish directory:** `.next` (auto-detected)
   - **Node version:** 18 (auto-detected from netlify.toml)

3. **Set Environment Variables**
   - Go to **Site settings → Build & deploy → Environment**
   - Add variables:
     ```
     DATABASE_URL=postgresql://...
     DIRECT_URL=postgresql://...
     NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
     ANTHROPIC_API_KEY=sk-ant-...
     ```
   - **Note:** Variables starting with `NEXT_PUBLIC_` are embedded in client JS

4. **Trigger Deploy**
   - Click "Deploy site"
   - Wait for build to complete (~67 seconds)
   - Site will be available at `https://pastr-app.netlify.app`

#### Option B: Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (from project root)
netlify deploy --prod --build

# Set environment variables before deploy
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set DIRECT_URL "postgresql://..."
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://...supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJ..."
netlify env:set ANTHROPIC_API_KEY "sk-ant-..."
```

### Current Live Deployment (PRIMARY)

- **URL:** https://pastr-app.netlify.app
- **Platform:** Netlify with @netlify/plugin-nextjs
- **Status:** Active
- **Routes:** 74 generated
- **Build Time:** ~67 seconds
- **TypeScript Errors:** 0
- **Auto-deploy:** Enabled (GitHub webhook)
- **Cron Jobs:** Via Vercel configuration (see section 6 below)

When you push to `master` branch, Netlify automatically rebuilds and deploys.

**Note:** Netlify is primary deployment platform. Vercel config retained for multi-platform flexibility.

---

## Vercel Deployment

### Configuration

The project retains `vercel.json` for Vercel compatibility.

### Deployment Steps

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import GitHub repository (affiliate-scorer)

2. **Configure Project**
   - Framework: Next.js (auto-detected)
   - Root directory: `.` (root)
   - Build command: `next build` (auto-detected)

3. **Set Environment Variables**
   - Go to **Settings → Environment Variables**
   - Add same variables as Netlify (see above)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy
   - Site will be available at `https://pastr.vercel.app`

### Switching Between Netlify and Vercel

Both configurations can coexist:
- Netlify: `netlify.toml` + GitHub webhook
- Vercel: `vercel.json` + Vercel UI

To deactivate Vercel deployments:
1. Go to Vercel project settings
2. Under "Deployments," pause automatic deploys
3. Or delete the Vercel project entirely

---

## Cron Job Deployment

### Scheduled Tasks (6 Total)

PASTR includes background cron jobs for learning, analytics, and resilience:

| Job | Schedule | Purpose | Endpoint |
|-----|----------|---------|----------|
| Morning Brief | Daily (23:00 UTC) | Generate daily AI brief | `/api/cron/morning-brief` |
| Nightly Learning | Daily (22:00 UTC) | Aggregate feedback, update memory | `/api/cron/nightly-learning` |
| Trend Analysis | Daily (22:30 UTC) | Analyze competitor captures | `/api/cron/trend-analysis` |
| Weekly Report | Sunday (06:00 UTC) | Weekly analytics report | `/api/cron/weekly-report` |
| Decay | Daily (01:00 UTC) | Apply decay to learning weights | `/api/cron/decay` |
| Retry Scoring | Daily (00:00 UTC) | Detect & retry failed imports | `/api/cron/retry-scoring` |

### Netlify Deployment — Cron Setup

Netlify functions do NOT support native cron scheduling. Options:

**Option A: EasyCron (Recommended, Free)**
1. Go to [easycron.com](https://easycron.com)
2. Create 6 cron jobs, one per endpoint:
   ```
   https://pastr-app.netlify.app/api/cron/nightly-learning
   ```
3. Set schedule per vercel.json (e.g., `0 22 * * *` for 22:00 UTC)
4. Add `CRON_SECRET` header: `Authorization: Bearer YOUR_SECRET`
5. Set `CRON_SECRET` env var in Netlify dashboard

**Option B: GitHub Actions (Recommended, No Cost)**
```yaml
# .github/workflows/cron.yml
name: Cron Jobs
on:
  schedule:
    - cron: '0 22 * * *'   # 22:00 UTC daily
    - cron: '30 22 * * *'  # 22:30 UTC daily
    - cron: '0 23 * * *'   # 23:00 UTC daily
jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X GET https://pastr-app.netlify.app/api/cron/nightly-learning \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Vercel Cron Architecture (Fallback)

If using Vercel, native cron support via `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/retry-scoring", "schedule": "0 0 * * *" },
    { "path": "/api/cron/decay", "schedule": "0 1 * * *" },
    { "path": "/api/cron/nightly-learning", "schedule": "0 22 * * *" },
    { "path": "/api/cron/weekly-report", "schedule": "0 6 * * 0" },
    { "path": "/api/cron/morning-brief", "schedule": "0 23 * * *" },
    { "path": "/api/cron/trend-analysis", "schedule": "30 22 * * *" }
  ]
}
```

Vercel handles scheduling automatically; no external setup needed.

### Cron Job Security

All cron endpoints should validate authorization:

```typescript
// app/api/cron/[job]/route.ts
if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Set `CRON_SECRET` environment variable** in deployment platform dashboard.

---

## Environment Variables

### Canonical Environment Variable Reference

This is the authoritative list. All other docs reference this table.

| Variable | Required | Purpose | Source |
|----------|----------|---------|--------|
| `DATABASE_URL` | **Yes** | PostgreSQL pooled connection (pgBouncer, port 6543) | Supabase Dashboard → Settings → Database |
| `DIRECT_URL` | **Yes** | Direct PostgreSQL connection (port 5432, for migrations) | Supabase Dashboard → Settings → Database |
| `ENCRYPTION_KEY` | **Yes** | 32-byte hex key for AES-256-GCM API key encryption. Generate: `openssl rand -hex 32` | Self-generated |
| `AUTH_SECRET` | Optional | Secret for `x-auth-secret` API header. Empty = same-origin only | Self-generated |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot for competitor video capture | @BotFather on Telegram |
| `CRON_SECRET` | Optional | Bearer token for cron job auth (Netlify external scheduler) | Self-generated |

> **AI provider API keys** (Anthropic, OpenAI, Google) are managed via Settings UI and stored encrypted in database — NOT in env vars.
>
> **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** are NOT in `.env.example` — the app uses Prisma (not Supabase JS client) for DB access. Only add these if using Supabase client features directly.

### How to Obtain

#### Supabase Database Variables
1. Go to [supabase.com](https://supabase.com) → open your project
2. **Settings → Database → Connection info** — copy:
   - `Connection string` (pooled, port 6543) → `DATABASE_URL`
   - `Direct connection` (port 5432) → `DIRECT_URL`

#### Encryption & Auth Keys
1. Generate ENCRYPTION_KEY: `openssl rand -hex 32`
2. Generate AUTH_SECRET: `openssl rand -hex 32`

#### AI Provider Keys
AI provider keys (Anthropic, OpenAI, Google) are configured in **Settings → API Keys** within the app UI. They are encrypted and stored in the database — NOT as environment variables.

### Local Testing

Before deploying, test locally:

```bash
# Copy example to .env.local
cp .env.example .env.local

# Fill in actual values
# DATABASE_URL=postgresql://user:password@host/db
# DIRECT_URL=postgresql://user:password@host/db
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# ANTHROPIC_API_KEY=sk-ant-...

# Test build
pnpm build

# Test local server
pnpm dev
```

---

## CI/CD Setup

### GitHub Webhook (Auto-Deploy on Push)

Netlify automatically sets up GitHub webhook when you connect repository.

**How it works:**
1. You push to `master` branch
2. GitHub triggers Netlify webhook
3. Netlify runs `pnpm build`
4. If build succeeds → Deploy to production
5. If build fails → Notification sent

**To verify webhook:**
- Go to GitHub: **Settings → Webhooks**
- Look for `netlify.com` entry
- Shows recent deliveries and status

**To disable auto-deploy:**
- Netlify: **Site settings → Build & deploy → Deploy contexts → Auto-publish** (uncheck)
- GitHub: Remove webhook under Settings → Webhooks

### Manual Deployment

If you need to deploy without pushing:

#### Netlify
```bash
netlify deploy --prod
```

#### Vercel
```bash
vercel --prod
```

### Preview Deployments

Netlify automatically creates preview builds for pull requests:
- Each PR gets unique preview URL
- Useful for testing before merge
- URLs shown in GitHub checks

To disable:
- Netlify: **Site settings → Build & deploy → Deploy contexts → Deploy previews** (uncheck)

---

## Troubleshooting

### Build Fails: "Cannot find module"

**Symptom:** Build error mentioning missing module

**Solution:**
```bash
# Clear dependencies and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Build Fails: "TypeScript errors"

**Symptom:** Build fails with TS compilation errors

**Solution:**
```bash
# Check errors locally first
pnpm build

# Fix type errors, then deploy
```

### Build Fails: "API key not configured"

**Symptom:** Build succeeds but site shows "API key missing" banner

**Solution:**
1. Verify env variables set in Netlify/Vercel dashboard
2. Check exact variable names (case-sensitive)
3. Restart deploy after updating env vars:
   - Netlify: **Builds → Trigger deploy → Deploy site**
   - Vercel: **Deployments → Redeploy**

### Database Connection Fails at Runtime

**Symptom:** Site loads but database operations fail (500 errors)

**Solution:**
1. Verify `DATABASE_URL` and `DIRECT_URL` are set
2. Check Supabase network allow list (add Netlify/Vercel IPs)
3. Verify Prisma migrations ran: `npx prisma migrate deploy`
4. Check database connection in Supabase dashboard

### Slow Build Time

**Expected:** ~67 seconds on Netlify

**If slower:**
1. Check build logs for bottlenecks
2. Verify no unnecessary dependencies
3. Consider clearing build cache:
   - Netlify: **Site settings → Build & deploy → Deploys → Clear cache and retry**

### Site Works Locally but Fails in Production

**Common Causes:**
- Missing env variables (check dashboard again)
- Hardcoded localhost URLs (use relative paths)
- Local file that doesn't exist in git (check .gitignore)

**Debug:**
1. Check Netlify build log for errors
2. Check Netlify function logs (if API routes fail)
3. Open browser DevTools → Network/Console tabs
4. Check Netlify site analytics

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass: `pnpm build` succeeds locally
- [ ] Environment variables configured in Netlify/Vercel dashboard
- [ ] Git repository is public or Netlify/Vercel has access
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] No secrets in code (check .gitignore)
- [ ] SEO meta tags configured
- [ ] Error pages working (404, 500)
- [ ] API routes return proper status codes
- [ ] Rate limiting enabled (if needed)
- [ ] Monitoring set up (Netlify Analytics, Sentry, etc.)

---

## Monitoring & Maintenance

### View Deployment Status

**Netlify:**
- Go to site → **Deploys** tab
- Shows all deployments, build time, status

**Vercel:**
- Go to project → **Deployments** tab
- Shows build logs, size analysis

### Analyze Performance

**Netlify Analytics:**
- Site → **Analytics** tab
- Requests, bandwidth, unique visitors

**Vercel Analytics:**
- Project → **Analytics** tab
- Core Web Vitals, page performance

### Rollback to Previous Deploy

**Netlify:**
1. Go to **Deploys**
2. Find previous successful deploy
3. Click **Publish deploy**

**Vercel:**
1. Go to **Deployments**
2. Find previous successful deploy
3. Click **Promote to Production**

### Update Dependencies

When updating packages:

```bash
# Update and lock
pnpm update

# Test build
pnpm build

# Commit and push
git add -A
git commit -m "deps: update dependencies"
git push origin master

# Netlify auto-deploys
```

---

## Support

- **Netlify Docs:** https://docs.netlify.com
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/learn/basics/deploying-nextjs-app
- **Supabase Docs:** https://supabase.com/docs
