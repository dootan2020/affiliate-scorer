-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionVND" DOUBLE PRECISION NOT NULL,
    "platform" TEXT NOT NULL,
    "salesTotal" INTEGER,
    "sales7d" INTEGER,
    "salesGrowth7d" DOUBLE PRECISION,
    "salesGrowth30d" DOUBLE PRECISION,
    "revenue7d" DOUBLE PRECISION,
    "revenue30d" DOUBLE PRECISION,
    "revenueTotal" DOUBLE PRECISION,
    "totalKOL" INTEGER,
    "kolOrderRate" DOUBLE PRECISION,
    "totalVideos" INTEGER,
    "totalLivestreams" INTEGER,
    "affiliateCount" INTEGER,
    "creatorCount" INTEGER,
    "topVideoViews" INTEGER,
    "imageUrl" TEXT,
    "tiktokUrl" TEXT,
    "fastmossUrl" TEXT,
    "shopFastmossUrl" TEXT,
    "shopName" TEXT,
    "shopRating" DOUBLE PRECISION,
    "productStatus" TEXT,
    "listingDate" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiScore" DOUBLE PRECISION,
    "aiRank" INTEGER,
    "scoreBreakdown" TEXT,
    "scoringVersion" TEXT,
    "contentSuggestion" TEXT,
    "platformAdvice" TEXT,
    "seasonalTag" TEXT,
    "sellWindowStart" TIMESTAMP(3),
    "sellWindowEnd" TIMESTAMP(3),
    "personalNotes" TEXT,
    "personalRating" INTEGER,
    "personalTags" TEXT[],
    "affiliateLink" TEXT,
    "affiliateLinkStatus" TEXT,
    "affiliateLinkCreatedAt" TIMESTAMP(3),
    "shopTrustScore" INTEGER,
    "source" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "dataDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identityId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "aiScoreAtSelection" DOUBLE PRECISION NOT NULL,
    "adPlatform" TEXT,
    "adImpressions" INTEGER,
    "adClicks" INTEGER,
    "adCTR" DOUBLE PRECISION,
    "adCPC" DOUBLE PRECISION,
    "adConversions" INTEGER,
    "adCostPerConv" DOUBLE PRECISION,
    "adROAS" DOUBLE PRECISION,
    "adSpend" DOUBLE PRECISION,
    "orgPlatform" TEXT,
    "orgViews" INTEGER,
    "orgLikes" INTEGER,
    "orgComments" INTEGER,
    "orgShares" INTEGER,
    "orgWatchTimeAvg" DOUBLE PRECISION,
    "orgLinkClicks" INTEGER,
    "videoType" TEXT,
    "videoDuration" INTEGER,
    "postDate" TIMESTAMP(3),
    "postTime" TEXT,
    "salesPlatform" TEXT,
    "orders" INTEGER,
    "revenue" DOUBLE PRECISION,
    "commissionEarned" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "overallSuccess" TEXT NOT NULL,
    "feedbackDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "campaignId" TEXT,
    "dataImportId" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningLog" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalDataPoints" INTEGER NOT NULL,
    "newDataPoints" INTEGER NOT NULL,
    "currentAccuracy" DOUBLE PRECISION NOT NULL,
    "previousAccuracy" DOUBLE PRECISION NOT NULL,
    "weightsBefore" TEXT NOT NULL,
    "weightsAfter" TEXT NOT NULL,
    "patternsFound" TEXT NOT NULL,
    "insights" TEXT NOT NULL,
    "scoringVersion" TEXT NOT NULL,

    CONSTRAINT "LearningLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "sales7d" INTEGER,
    "salesTotal" INTEGER,
    "revenue7d" DOUBLE PRECISION,
    "revenueTotal" DOUBLE PRECISION,
    "totalKOL" INTEGER,
    "totalVideos" INTEGER,
    "kolOrderRate" DOUBLE PRECISION,
    "productStatus" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rowsProcessed" INTEGER NOT NULL DEFAULT 0,
    "rowsCreated" INTEGER NOT NULL DEFAULT 0,
    "rowsUpdated" INTEGER NOT NULL DEFAULT 0,
    "rowsError" INTEGER NOT NULL DEFAULT 0,
    "scoringStatus" TEXT NOT NULL DEFAULT 'pending',
    "scoredCount" INTEGER NOT NULL DEFAULT 0,
    "errorLog" JSONB,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataImport" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "detectedType" TEXT,
    "detectionConfidence" TEXT,
    "userConfirmedType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rowsTotal" INTEGER NOT NULL DEFAULT 0,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "rowsSkipped" INTEGER NOT NULL DEFAULT 0,
    "rowsError" INTEGER NOT NULL DEFAULT 0,
    "campaignsCreated" INTEGER NOT NULL DEFAULT 0,
    "campaignsUpdated" INTEGER NOT NULL DEFAULT 0,
    "productsCreated" INTEGER NOT NULL DEFAULT 0,
    "productsUpdated" INTEGER NOT NULL DEFAULT 0,
    "financialRecordsCreated" INTEGER NOT NULL DEFAULT 0,
    "errorLog" JSONB,
    "metadata" JSONB,
    "importedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "plannedBudgetDaily" INTEGER,
    "plannedDurationDays" INTEGER,
    "affiliateLink" TEXT,
    "contentUrl" TEXT,
    "contentType" TEXT,
    "contentNotes" TEXT,
    "postedAt" TIMESTAMP(3),
    "dailyResults" JSONB NOT NULL DEFAULT '[]',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "totalSpend" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION,
    "profitLoss" INTEGER NOT NULL DEFAULT 0,
    "verdict" TEXT,
    "lessonsLearned" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "dataImportId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "productId" TEXT,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "contentType" TEXT,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "notes" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'monthly_profit',
    "targetAmount" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "currentAmount" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "commissionReliability" INTEGER,
    "supportQuality" INTEGER,
    "samplePolicy" TEXT,
    "commissionCutHistory" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "source" TEXT NOT NULL,
    "referenceId" TEXT,
    "productId" TEXT,
    "campaignId" TEXT,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "prepStartDate" DATE,
    "platforms" TEXT[],
    "notes" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WinPattern" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "campaignIds" JSONB NOT NULL DEFAULT '[]',
    "winRate" DOUBLE PRECISION NOT NULL,
    "avgROAS" DOUBLE PRECISION NOT NULL,
    "totalProfit" INTEGER NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WinPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "reportData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIdentity" (
    "id" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "fingerprintHash" TEXT,
    "productIdExternal" TEXT,
    "title" TEXT,
    "shopName" TEXT,
    "category" TEXT,
    "price" INTEGER,
    "commissionRate" DECIMAL(5,2),
    "imageUrl" TEXT,
    "description" TEXT,
    "inboxState" TEXT NOT NULL DEFAULT 'new',
    "marketScore" DECIMAL(5,2),
    "contentPotentialScore" DECIMAL(5,2),
    "combinedScore" DECIMAL(5,2),
    "lifecycleStage" TEXT,
    "deltaType" TEXT,
    "personalNotes" TEXT,
    "personalRating" INTEGER,
    "personalTags" JSONB NOT NULL DEFAULT '[]',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductUrl" (
    "id" TEXT NOT NULL,
    "productIdentityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlType" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL,
    "rawUrl" TEXT NOT NULL,
    "detectedType" TEXT NOT NULL,
    "productIdentityId" TEXT,
    "extractedTitle" TEXT,
    "extractedMetadata" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBrief" (
    "id" TEXT NOT NULL,
    "productIdentityId" TEXT NOT NULL,
    "channelId" TEXT,
    "angles" JSONB NOT NULL DEFAULT '[]',
    "hooks" JSONB NOT NULL DEFAULT '[]',
    "scripts" JSONB NOT NULL DEFAULT '[]',
    "aiModel" TEXT DEFAULT 'claude',
    "promptUsed" TEXT,
    "generationTimeMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "formatSlug" TEXT,
    "qcStatus" TEXT,
    "qcDetails" JSONB,
    "bibleVersion" INTEGER,
    "videoBibleVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAsset" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT,
    "productIdentityId" TEXT NOT NULL,
    "briefId" TEXT,
    "productionBatchId" TEXT,
    "hookText" TEXT,
    "hookType" TEXT,
    "format" TEXT,
    "angle" TEXT,
    "scriptText" TEXT,
    "captionText" TEXT,
    "hashtags" JSONB NOT NULL DEFAULT '[]',
    "ctaText" TEXT,
    "videoPrompts" JSONB NOT NULL DEFAULT '[]',
    "contentType" TEXT,
    "videoFormat" TEXT,
    "targetDuration" INTEGER,
    "channelId" TEXT,
    "hookOptions" JSONB,
    "soundStyle" TEXT,
    "ctaSuggestion" TEXT,
    "complianceStatus" TEXT DEFAULT 'unchecked',
    "complianceNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedUrl" TEXT,
    "postId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBatch" (
    "id" TEXT NOT NULL,
    "batchDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetVideoCount" INTEGER NOT NULL,
    "actualVideoCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMetric" (
    "id" TEXT NOT NULL,
    "contentAssetId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "avgWatchTimeS" DECIMAL(5,2),
    "completionRate" DECIMAL(3,2),
    "followersGained" INTEGER,
    "clicks" INTEGER,
    "orders" INTEGER,
    "commissionAmount" INTEGER,
    "rewardScore" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningWeightP4" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "channelId" TEXT NOT NULL DEFAULT '',
    "weight" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "avgReward" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "decayHalfLifeDays" INTEGER NOT NULL DEFAULT 14,
    "lastRewardAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningWeightP4_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPattern" (
    "id" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "assetIds" JSONB NOT NULL DEFAULT '[]',
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "avgViews" INTEGER,
    "avgReward" DECIMAL(8,4),
    "winRate" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "productIdentityId" TEXT,
    "contentAssetId" TEXT,
    "amount" INTEGER NOT NULL,
    "platform" TEXT,
    "earnedDate" DATE NOT NULL,
    "receivedDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBrief" (
    "id" TEXT NOT NULL,
    "briefDate" DATE NOT NULL,
    "content" JSONB NOT NULL,
    "aiModel" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalP5" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "targetVideos" INTEGER,
    "targetCommission" INTEGER,
    "targetViews" INTEGER,
    "actualVideos" INTEGER NOT NULL DEFAULT 0,
    "actualCommission" INTEGER NOT NULL DEFAULT 0,
    "actualViews" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalP5_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDailyStat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "videoViews" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowerActivity" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "activeCount" INTEGER NOT NULL DEFAULT 0,
    "importBatchId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountInsight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATE,
    "data" JSONB NOT NULL,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModelConfig" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiProvider" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "niche" TEXT NOT NULL DEFAULT 'beauty_skincare',
    "personaName" TEXT NOT NULL,
    "personaDesc" TEXT NOT NULL,
    "voiceStyle" TEXT NOT NULL DEFAULT 'casual',
    "targetAudience" TEXT,
    "colorPrimary" TEXT,
    "colorSecondary" TEXT,
    "fontStyle" TEXT,
    "editingStyle" TEXT,
    "subNiche" TEXT,
    "usp" TEXT,
    "contentPillars" JSONB,
    "hookBank" JSONB,
    "contentMix" JSONB,
    "postsPerDay" INTEGER,
    "postingSchedule" JSONB,
    "seriesSchedule" JSONB,
    "contentPillarDetails" JSONB,
    "videoFormats" JSONB,
    "productionStyle" TEXT,
    "productionStyleReason" TEXT,
    "ctaTemplates" JSONB,
    "competitorChannels" JSONB,
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "aiGeneratedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TikTokChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSlot" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "scheduledTime" TEXT,
    "contentType" TEXT NOT NULL,
    "videoFormat" TEXT,
    "productIdentityId" TEXT,
    "contentAssetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTracking" (
    "id" TEXT NOT NULL,
    "contentAssetId" TEXT NOT NULL,
    "tiktokVideoUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "views24h" INTEGER,
    "views7d" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "clicksToShop" INTEGER,
    "orders" INTEGER,
    "revenue" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "winReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacticalRefreshLog" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "trendingContext" TEXT,
    "usedTracking" BOOLEAN NOT NULL DEFAULT false,
    "analysisNotes" TEXT,
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "appliedFields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TacticalRefreshLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGalleryImage" (
    "id" TEXT NOT NULL,
    "productIdentityId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterBible" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "coreValues" JSONB,
    "coreFear" TEXT,
    "crisisResponse" TEXT,
    "redLines" JSONB,
    "relationships" JSONB,
    "worldRules" JSONB,
    "weaknesses" JSONB,
    "originWound" TEXT,
    "originVow" TEXT,
    "originSymbol" TEXT,
    "livingSpaces" JSONB,
    "storyArcs" JSONB,
    "catchphrases" JSONB,
    "insideJokes" JSONB,
    "rituals" JSONB,
    "vocabularyRules" JSONB,
    "visualLocks" JSONB,
    "voiceDna" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "aiGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterBible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormatTemplate" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "hookTemplate" TEXT,
    "bodyTemplate" TEXT,
    "proofTemplate" TEXT,
    "ctaTemplate" TEXT,
    "exampleScript" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormatTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaMatrixItem" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "bibleLayer" TEXT NOT NULL,
    "layerDetail" TEXT NOT NULL,
    "formatSlug" TEXT NOT NULL,
    "ideaTitle" TEXT NOT NULL,
    "hookSuggestions" JSONB,
    "angle" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'fresh',
    "briefId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaMatrixItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoBible" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "framing" TEXT,
    "lighting" TEXT,
    "composition" TEXT,
    "palette" TEXT,
    "editRhythm" TEXT,
    "voiceStyleLock" TEXT,
    "sfxPack" JSONB,
    "bgmMoods" JSONB,
    "roomTone" TEXT,
    "openingRitual" TEXT,
    "proofTokenRule" TEXT,
    "closingRitual" TEXT,
    "aiMode" TEXT NOT NULL DEFAULT 'hybrid',
    "version" INTEGER NOT NULL DEFAULT 1,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "aiGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoBible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShotCode" (
    "id" TEXT NOT NULL,
    "videoBibleId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationHint" TEXT,
    "camera" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShotCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneTemplate" (
    "id" TEXT NOT NULL,
    "videoBibleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "blocks" JSONB NOT NULL,
    "defaultShotSequence" JSONB,
    "rules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "premise" TEXT,
    "openingRitual" TEXT,
    "closingRitual" TEXT,
    "proofRule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "formatSlug" TEXT,
    "pillar" TEXT,
    "contentAssetId" TEXT,
    "plannedDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_identityId_key" ON "Product"("identityId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_aiScore_idx" ON "Product"("aiScore");

-- CreateIndex
CREATE INDEX "Product_dataDate_idx" ON "Product"("dataDate");

-- CreateIndex
CREATE INDEX "Product_name_shopName_idx" ON "Product"("name", "shopName");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tiktokUrl_key" ON "Product"("tiktokUrl");

-- CreateIndex
CREATE INDEX "Feedback_productId_idx" ON "Feedback"("productId");

-- CreateIndex
CREATE INDEX "Feedback_overallSuccess_idx" ON "Feedback"("overallSuccess");

-- CreateIndex
CREATE INDEX "Feedback_feedbackDate_idx" ON "Feedback"("feedbackDate");

-- CreateIndex
CREATE INDEX "Feedback_campaignId_idx" ON "Feedback"("campaignId");

-- CreateIndex
CREATE INDEX "LearningLog_weekNumber_idx" ON "LearningLog"("weekNumber");

-- CreateIndex
CREATE INDEX "ProductSnapshot_productId_snapshotDate_idx" ON "ProductSnapshot"("productId", "snapshotDate");

-- CreateIndex
CREATE INDEX "ProductSnapshot_importBatchId_idx" ON "ProductSnapshot"("importBatchId");

-- CreateIndex
CREATE INDEX "ImportBatch_status_idx" ON "ImportBatch"("status");

-- CreateIndex
CREATE INDEX "DataImport_sourceType_idx" ON "DataImport"("sourceType");

-- CreateIndex
CREATE INDEX "DataImport_status_idx" ON "DataImport"("status");

-- CreateIndex
CREATE INDEX "DataImport_createdAt_idx" ON "DataImport"("createdAt");

-- CreateIndex
CREATE INDEX "Campaign_productId_idx" ON "Campaign"("productId");

-- CreateIndex
CREATE INDEX "Campaign_platform_idx" ON "Campaign"("platform");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "ContentPost_campaignId_idx" ON "ContentPost"("campaignId");

-- CreateIndex
CREATE INDEX "ContentPost_productId_idx" ON "ContentPost"("productId");

-- CreateIndex
CREATE INDEX "UserGoal_periodStart_idx" ON "UserGoal"("periodStart");

-- CreateIndex
CREATE INDEX "Shop_platform_idx" ON "Shop"("platform");

-- CreateIndex
CREATE INDEX "FinancialRecord_type_idx" ON "FinancialRecord"("type");

-- CreateIndex
CREATE INDEX "FinancialRecord_date_idx" ON "FinancialRecord"("date");

-- CreateIndex
CREATE INDEX "FinancialRecord_source_idx" ON "FinancialRecord"("source");

-- CreateIndex
CREATE INDEX "FinancialRecord_campaignId_type_date_idx" ON "FinancialRecord"("campaignId", "type", "date");

-- CreateIndex
CREATE INDEX "CalendarEvent_startDate_idx" ON "CalendarEvent"("startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventType_idx" ON "CalendarEvent"("eventType");

-- CreateIndex
CREATE INDEX "WinPattern_patternType_idx" ON "WinPattern"("patternType");

-- CreateIndex
CREATE INDEX "WeeklyReport_weekStart_idx" ON "WeeklyReport"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIdentity_canonicalUrl_key" ON "ProductIdentity"("canonicalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIdentity_fingerprintHash_key" ON "ProductIdentity"("fingerprintHash");

-- CreateIndex
CREATE INDEX "ProductIdentity_inboxState_idx" ON "ProductIdentity"("inboxState");

-- CreateIndex
CREATE INDEX "ProductIdentity_combinedScore_idx" ON "ProductIdentity"("combinedScore" DESC);

-- CreateIndex
CREATE INDEX "ProductIdentity_deltaType_idx" ON "ProductIdentity"("deltaType");

-- CreateIndex
CREATE UNIQUE INDEX "ProductUrl_url_key" ON "ProductUrl"("url");

-- CreateIndex
CREATE INDEX "ProductUrl_productIdentityId_idx" ON "ProductUrl"("productIdentityId");

-- CreateIndex
CREATE INDEX "InboxItem_productIdentityId_idx" ON "InboxItem"("productIdentityId");

-- CreateIndex
CREATE INDEX "InboxItem_status_idx" ON "InboxItem"("status");

-- CreateIndex
CREATE INDEX "ContentBrief_productIdentityId_idx" ON "ContentBrief"("productIdentityId");

-- CreateIndex
CREATE INDEX "ContentBrief_channelId_idx" ON "ContentBrief"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentAsset_assetCode_key" ON "ContentAsset"("assetCode");

-- CreateIndex
CREATE INDEX "ContentAsset_productIdentityId_idx" ON "ContentAsset"("productIdentityId");

-- CreateIndex
CREATE INDEX "ContentAsset_status_idx" ON "ContentAsset"("status");

-- CreateIndex
CREATE INDEX "ContentAsset_productionBatchId_idx" ON "ContentAsset"("productionBatchId");

-- CreateIndex
CREATE INDEX "ContentAsset_postId_idx" ON "ContentAsset"("postId");

-- CreateIndex
CREATE INDEX "ContentAsset_channelId_idx" ON "ContentAsset"("channelId");

-- CreateIndex
CREATE INDEX "AssetMetric_contentAssetId_idx" ON "AssetMetric"("contentAssetId");

-- CreateIndex
CREATE INDEX "AssetMetric_capturedAt_idx" ON "AssetMetric"("capturedAt" DESC);

-- CreateIndex
CREATE INDEX "LearningWeightP4_scope_idx" ON "LearningWeightP4"("scope");

-- CreateIndex
CREATE INDEX "LearningWeightP4_channelId_idx" ON "LearningWeightP4"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningWeightP4_scope_key_channelId_key" ON "LearningWeightP4"("scope", "key", "channelId");

-- CreateIndex
CREATE INDEX "Commission_productIdentityId_idx" ON "Commission"("productIdentityId");

-- CreateIndex
CREATE INDEX "Commission_contentAssetId_idx" ON "Commission"("contentAssetId");

-- CreateIndex
CREATE INDEX "Commission_earnedDate_idx" ON "Commission"("earnedDate" DESC);

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBrief_briefDate_key" ON "DailyBrief"("briefDate");

-- CreateIndex
CREATE INDEX "DailyBrief_briefDate_idx" ON "DailyBrief"("briefDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GoalP5_periodType_periodStart_key" ON "GoalP5"("periodType", "periodStart");

-- CreateIndex
CREATE INDEX "AccountDailyStat_date_idx" ON "AccountDailyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AccountDailyStat_date_key" ON "AccountDailyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "FollowerActivity_dayOfWeek_hour_key" ON "FollowerActivity"("dayOfWeek", "hour");

-- CreateIndex
CREATE INDEX "AccountInsight_type_idx" ON "AccountInsight"("type");

-- CreateIndex
CREATE INDEX "AccountInsight_date_idx" ON "AccountInsight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AiModelConfig_taskType_key" ON "AiModelConfig"("taskType");

-- CreateIndex
CREATE UNIQUE INDEX "ApiProvider_provider_key" ON "ApiProvider"("provider");

-- CreateIndex
CREATE INDEX "ContentSlot_channelId_scheduledDate_idx" ON "ContentSlot"("channelId", "scheduledDate");

-- CreateIndex
CREATE INDEX "ContentSlot_scheduledDate_idx" ON "ContentSlot"("scheduledDate");

-- CreateIndex
CREATE INDEX "ContentSlot_contentAssetId_idx" ON "ContentSlot"("contentAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoTracking_contentAssetId_key" ON "VideoTracking"("contentAssetId");

-- CreateIndex
CREATE INDEX "VideoTracking_isWinner_idx" ON "VideoTracking"("isWinner");

-- CreateIndex
CREATE INDEX "TacticalRefreshLog_channelId_createdAt_idx" ON "TacticalRefreshLog"("channelId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProductGalleryImage_productIdentityId_idx" ON "ProductGalleryImage"("productIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterBible_channelId_key" ON "CharacterBible"("channelId");

-- CreateIndex
CREATE INDEX "FormatTemplate_channelId_idx" ON "FormatTemplate"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "FormatTemplate_channelId_slug_key" ON "FormatTemplate"("channelId", "slug");

-- CreateIndex
CREATE INDEX "IdeaMatrixItem_channelId_status_idx" ON "IdeaMatrixItem"("channelId", "status");

-- CreateIndex
CREATE INDEX "IdeaMatrixItem_channelId_bibleLayer_idx" ON "IdeaMatrixItem"("channelId", "bibleLayer");

-- CreateIndex
CREATE UNIQUE INDEX "VideoBible_channelId_key" ON "VideoBible"("channelId");

-- CreateIndex
CREATE INDEX "ShotCode_videoBibleId_idx" ON "ShotCode"("videoBibleId");

-- CreateIndex
CREATE UNIQUE INDEX "ShotCode_videoBibleId_code_key" ON "ShotCode"("videoBibleId", "code");

-- CreateIndex
CREATE INDEX "SceneTemplate_videoBibleId_idx" ON "SceneTemplate"("videoBibleId");

-- CreateIndex
CREATE UNIQUE INDEX "SceneTemplate_videoBibleId_slug_key" ON "SceneTemplate"("videoBibleId", "slug");

-- CreateIndex
CREATE INDEX "Series_channelId_idx" ON "Series"("channelId");

-- CreateIndex
CREATE INDEX "Series_channelId_status_idx" ON "Series"("channelId", "status");

-- CreateIndex
CREATE INDEX "Episode_seriesId_idx" ON "Episode"("seriesId");

-- CreateIndex
CREATE INDEX "Episode_seriesId_episodeNumber_idx" ON "Episode"("seriesId", "episodeNumber");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "ProductIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_dataImportId_fkey" FOREIGN KEY ("dataImportId") REFERENCES "DataImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSnapshot" ADD CONSTRAINT "ProductSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSnapshot" ADD CONSTRAINT "ProductSnapshot_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPost" ADD CONSTRAINT "ContentPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPost" ADD CONSTRAINT "ContentPost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUrl" ADD CONSTRAINT "ProductUrl_productIdentityId_fkey" FOREIGN KEY ("productIdentityId") REFERENCES "ProductIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_productIdentityId_fkey" FOREIGN KEY ("productIdentityId") REFERENCES "ProductIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBrief" ADD CONSTRAINT "ContentBrief_productIdentityId_fkey" FOREIGN KEY ("productIdentityId") REFERENCES "ProductIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBrief" ADD CONSTRAINT "ContentBrief_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_productIdentityId_fkey" FOREIGN KEY ("productIdentityId") REFERENCES "ProductIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "ContentBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "ProductionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAsset" ADD CONSTRAINT "ContentAsset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "ContentAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMetric" ADD CONSTRAINT "AssetMetric_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_productIdentityId_fkey" FOREIGN KEY ("productIdentityId") REFERENCES "ProductIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSlot" ADD CONSTRAINT "ContentSlot_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSlot" ADD CONSTRAINT "ContentSlot_productIdentityId_fkey" FOREIGN KEY ("productIdentityId") REFERENCES "ProductIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSlot" ADD CONSTRAINT "ContentSlot_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTracking" ADD CONSTRAINT "VideoTracking_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "ContentAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacticalRefreshLog" ADD CONSTRAINT "TacticalRefreshLog_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGalleryImage" ADD CONSTRAINT "ProductGalleryImage_productIdentityId_fkey" FOREIGN KEY ("productIdentityId") REFERENCES "ProductIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterBible" ADD CONSTRAINT "CharacterBible_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormatTemplate" ADD CONSTRAINT "FormatTemplate_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaMatrixItem" ADD CONSTRAINT "IdeaMatrixItem_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoBible" ADD CONSTRAINT "VideoBible_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShotCode" ADD CONSTRAINT "ShotCode_videoBibleId_fkey" FOREIGN KEY ("videoBibleId") REFERENCES "VideoBible"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneTemplate" ADD CONSTRAINT "SceneTemplate_videoBibleId_fkey" FOREIGN KEY ("videoBibleId") REFERENCES "VideoBible"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TikTokChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

