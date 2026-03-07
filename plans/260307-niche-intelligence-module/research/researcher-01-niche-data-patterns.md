# Research: Niche Data Patterns & Onboarding Flow

## Niche System
- 12 core niches in `lib/suggestions/niche-category-map.ts` (beauty_skincare, home_living, tech, fashion, health, food, garden, sports, books_media, toys, automotive, mother_baby)
- `normalizeNicheKey()` + `matchesNiche()` for product-channel matching
- TikTokChannel.niche defaults to "beauty_skincare"

## Product Data for Recommendations
- Product table: salesTotal, sales7d, revenue7d, totalKOL, commissionRate, affiliateCount, creatorCount
- ProductIdentity: marketScore, contentPotentialScore, lifecycleStage, deltaType
- LearningWeightP4: per-category performance weights
- Commission table: actual earnings by product

## Current Onboarding
- New user → dashboard → DashboardEmptyState ("Chào mừng đến PASTR!")
- Two CTAs: "Đồng bộ sản phẩm" → /sync, "Tạo kênh" → /channels
- Channel creation: user must enter niche manually (no suggestions)
- NO niche recommendation anywhere in the system

## Dashboard Structure
- 5 widgets: OrphanAlert, YesterdayStats, MorningBrief+ContentSuggestions, ChannelTaskBoard, WinningPatterns
- No niche recommendation widget exists

## Key Gap
User MUST know their niche before starting. No discovery/recommendation flow exists.
