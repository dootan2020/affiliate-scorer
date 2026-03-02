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

### Current Live Deployment

- **URL:** https://pastr-app.netlify.app
- **Status:** Active
- **Routes:** 74 generated
- **Build Time:** ~67 seconds
- **TypeScript Errors:** 0
- **Auto-deploy:** Enabled (GitHub webhook)

When you push to `master` branch, Netlify automatically rebuilds and deploys.

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

## Environment Variables

### Required Variables

| Variable | Purpose | Source |
|----------|---------|--------|
| `DATABASE_URL` | Primary PostgreSQL connection | Supabase Dashboard |
| `DIRECT_URL` | Direct DB connection (migrations) | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API endpoint | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard |
| `ANTHROPIC_API_KEY` | Claude API access | Anthropic Console |

### How to Obtain

#### Supabase Variables
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. **Settings → API** — copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Settings → Database → Connection info** — copy:
   - `Connection string` (with password) → `DATABASE_URL`
   - `Direct connection` → `DIRECT_URL`

#### Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. **Settings → API Keys**
3. Create or copy existing key → `ANTHROPIC_API_KEY`

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
