-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "commissionRate" REAL NOT NULL,
    "commissionVND" REAL NOT NULL,
    "platform" TEXT NOT NULL,
    "salesTotal" INTEGER,
    "salesGrowth7d" REAL,
    "salesGrowth30d" REAL,
    "revenue7d" REAL,
    "revenue30d" REAL,
    "affiliateCount" INTEGER,
    "creatorCount" INTEGER,
    "topVideoViews" INTEGER,
    "shopName" TEXT,
    "shopRating" REAL,
    "aiScore" REAL,
    "aiRank" INTEGER,
    "scoreBreakdown" TEXT,
    "scoringVersion" TEXT,
    "contentSuggestion" TEXT,
    "platformAdvice" TEXT,
    "source" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "dataDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "aiScoreAtSelection" REAL NOT NULL,
    "adPlatform" TEXT,
    "adImpressions" INTEGER,
    "adClicks" INTEGER,
    "adCTR" REAL,
    "adCPC" REAL,
    "adConversions" INTEGER,
    "adCostPerConv" REAL,
    "adROAS" REAL,
    "adSpend" REAL,
    "orgPlatform" TEXT,
    "orgViews" INTEGER,
    "orgLikes" INTEGER,
    "orgComments" INTEGER,
    "orgShares" INTEGER,
    "orgWatchTimeAvg" REAL,
    "orgLinkClicks" INTEGER,
    "videoType" TEXT,
    "videoDuration" INTEGER,
    "postDate" DATETIME,
    "postTime" TEXT,
    "salesPlatform" TEXT,
    "orders" INTEGER,
    "revenue" REAL,
    "commissionEarned" REAL,
    "conversionRate" REAL,
    "overallSuccess" TEXT NOT NULL,
    "feedbackDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "Feedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekNumber" INTEGER NOT NULL,
    "runDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalDataPoints" INTEGER NOT NULL,
    "newDataPoints" INTEGER NOT NULL,
    "currentAccuracy" REAL NOT NULL,
    "previousAccuracy" REAL NOT NULL,
    "weightsBefore" TEXT NOT NULL,
    "weightsAfter" TEXT NOT NULL,
    "patternsFound" TEXT NOT NULL,
    "insights" TEXT NOT NULL,
    "scoringVersion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "importDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_aiScore_idx" ON "Product"("aiScore");

-- CreateIndex
CREATE INDEX "Product_dataDate_idx" ON "Product"("dataDate");

-- CreateIndex
CREATE INDEX "Feedback_productId_idx" ON "Feedback"("productId");

-- CreateIndex
CREATE INDEX "Feedback_overallSuccess_idx" ON "Feedback"("overallSuccess");

-- CreateIndex
CREATE INDEX "Feedback_feedbackDate_idx" ON "Feedback"("feedbackDate");

-- CreateIndex
CREATE INDEX "LearningLog_weekNumber_idx" ON "LearningLog"("weekNumber");
