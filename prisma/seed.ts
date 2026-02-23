import { join } from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const DEMO_PRODUCTS = [
  {
    name: "Máy massage cổ HQ-168 Pro",
    category: "Health",
    price: 389000,
    commissionRate: 12,
    commissionVND: 46680,
    platform: "tiktok_shop",
    salesTotal: 2340,
    salesGrowth7d: 340,
    salesGrowth30d: 120,
    revenue7d: 912000000,
    revenue30d: 2800000000,
    affiliateCount: 12,
    creatorCount: 8,
    topVideoViews: 450000,
    shopName: "HealthGadget Official",
    shopRating: 4.8,
    source: "fastmoss",
  },
  {
    name: "Serum HA Plus Hydra 30ml",
    category: "Beauty",
    price: 245000,
    commissionRate: 15,
    commissionVND: 36750,
    platform: "shopee",
    salesTotal: 5600,
    salesGrowth7d: 180,
    salesGrowth30d: 95,
    revenue7d: 1372000000,
    revenue30d: 3200000000,
    affiliateCount: 8,
    creatorCount: 15,
    topVideoViews: 320000,
    shopName: "BeautyLab VN",
    shopRating: 4.9,
    source: "kalodata",
  },
  {
    name: "Máy xay sinh tố mini portable",
    category: "Gia dụng",
    price: 299000,
    commissionRate: 10,
    commissionVND: 29900,
    platform: "both",
    salesTotal: 8900,
    salesGrowth7d: 85,
    salesGrowth30d: 60,
    revenue7d: 2671000000,
    revenue30d: 6500000000,
    affiliateCount: 25,
    creatorCount: 20,
    topVideoViews: 890000,
    shopName: "HomeLife Store",
    shopRating: 4.7,
    source: "fastmoss",
  },
  {
    name: "Tai nghe Bluetooth TWS Pro Max",
    category: "Công nghệ",
    price: 459000,
    commissionRate: 8,
    commissionVND: 36720,
    platform: "tiktok_shop",
    salesTotal: 3200,
    salesGrowth7d: 220,
    salesGrowth30d: 150,
    revenue7d: 1468800000,
    revenue30d: 3500000000,
    affiliateCount: 18,
    creatorCount: 12,
    topVideoViews: 670000,
    shopName: "TechZone VN",
    shopRating: 4.6,
    source: "kalodata",
  },
  {
    name: "Kem chống nắng tone up SPF50+",
    category: "Beauty",
    price: 189000,
    commissionRate: 14,
    commissionVND: 26460,
    platform: "shopee",
    salesTotal: 12000,
    salesGrowth7d: 45,
    salesGrowth30d: 30,
    revenue7d: 2268000000,
    revenue30d: 5400000000,
    affiliateCount: 42,
    creatorCount: 35,
    topVideoViews: 1200000,
    shopName: "SunCare Official",
    shopRating: 4.8,
    source: "fastmoss",
  },
  {
    name: "Đèn bàn LED chống cận mắt",
    category: "Gia dụng",
    price: 350000,
    commissionRate: 9,
    commissionVND: 31500,
    platform: "both",
    salesTotal: 1800,
    salesGrowth7d: 420,
    salesGrowth30d: 200,
    revenue7d: 630000000,
    revenue30d: 1500000000,
    affiliateCount: 5,
    creatorCount: 3,
    topVideoViews: 180000,
    shopName: "SmartHome VN",
    shopRating: 4.5,
    source: "kalodata",
  },
  {
    name: "Bộ dụng cụ làm nail gel UV",
    category: "Beauty",
    price: 420000,
    commissionRate: 11,
    commissionVND: 46200,
    platform: "tiktok_shop",
    salesTotal: 950,
    salesGrowth7d: 560,
    salesGrowth30d: 300,
    revenue7d: 399000000,
    revenue30d: 900000000,
    affiliateCount: 3,
    creatorCount: 4,
    topVideoViews: 750000,
    shopName: "NailArt Beauty",
    shopRating: 4.7,
    source: "fastmoss",
  },
  {
    name: "Áo khoác gió unisex siêu nhẹ",
    category: "Thời trang",
    price: 280000,
    commissionRate: 7,
    commissionVND: 19600,
    platform: "shopee",
    salesTotal: 6700,
    salesGrowth7d: 25,
    salesGrowth30d: 15,
    revenue7d: 1876000000,
    revenue30d: 4500000000,
    affiliateCount: 55,
    creatorCount: 40,
    topVideoViews: 560000,
    shopName: "FashionHub Official",
    shopRating: 4.4,
    source: "kalodata",
  },
  {
    name: "Robot hút bụi mini thông minh",
    category: "Công nghệ",
    price: 890000,
    commissionRate: 6,
    commissionVND: 53400,
    platform: "tiktok_shop",
    salesTotal: 450,
    salesGrowth7d: 150,
    salesGrowth30d: 80,
    revenue7d: 400500000,
    revenue30d: 900000000,
    affiliateCount: 10,
    creatorCount: 7,
    topVideoViews: 340000,
    shopName: "SmartHome VN",
    shopRating: 4.5,
    source: "fastmoss",
  },
  {
    name: "Bình giữ nhiệt thông minh LED",
    category: "Gia dụng",
    price: 199000,
    commissionRate: 13,
    commissionVND: 25870,
    platform: "both",
    salesTotal: 4200,
    salesGrowth7d: 280,
    salesGrowth30d: 160,
    revenue7d: 835800000,
    revenue30d: 2000000000,
    affiliateCount: 7,
    creatorCount: 6,
    topVideoViews: 520000,
    shopName: "LifeGadget Store",
    shopRating: 4.6,
    source: "kalodata",
  },
  {
    name: "Máy tạo ẩm phun sương mini USB",
    category: "Health",
    price: 159000,
    commissionRate: 16,
    commissionVND: 25440,
    platform: "shopee",
    salesTotal: 7800,
    salesGrowth7d: 65,
    salesGrowth30d: 40,
    revenue7d: 1240200000,
    revenue30d: 2800000000,
    affiliateCount: 30,
    creatorCount: 22,
    topVideoViews: 400000,
    shopName: "HealthHome Store",
    shopRating: 4.7,
    source: "fastmoss",
  },
  {
    name: "Loa Bluetooth chống nước IPX7",
    category: "Công nghệ",
    price: 520000,
    commissionRate: 9,
    commissionVND: 46800,
    platform: "tiktok_shop",
    salesTotal: 1600,
    salesGrowth7d: 190,
    salesGrowth30d: 110,
    revenue7d: 832000000,
    revenue30d: 1900000000,
    affiliateCount: 15,
    creatorCount: 10,
    topVideoViews: 280000,
    shopName: "AudioTech VN",
    shopRating: 4.5,
    source: "kalodata",
  },
];

async function main(): Promise<void> {
  console.log("Seeding database...");

  // Create import batch
  const batch = await prisma.importBatch.create({
    data: {
      source: "demo_seed",
      fileName: "seed-data.csv",
      recordCount: DEMO_PRODUCTS.length,
    },
  });

  // Create products
  const products = await Promise.all(
    DEMO_PRODUCTS.map((p) =>
      prisma.product.create({
        data: {
          ...p,
          importBatchId: batch.id,
          dataDate: new Date(),
        },
      })
    )
  );

  console.log(`Created ${products.length} demo products`);

  // Create feedbacks for first 6 products
  const feedbackData = [
    { idx: 0, overallSuccess: "success", adROAS: 3.5, adSpend: 500000, adConversions: 12, orders: 8 },
    { idx: 1, overallSuccess: "success", adROAS: 4.2, adSpend: 300000, adConversions: 18, orders: 15 },
    { idx: 2, overallSuccess: "moderate", adROAS: 1.5, adSpend: 400000, adConversions: 5, orders: 3 },
    { idx: 3, overallSuccess: "poor", adROAS: 0.6, adSpend: 600000, adConversions: 2, orders: 1 },
    { idx: 4, overallSuccess: "success", adROAS: 2.8, adSpend: 250000, adConversions: 10, orders: 7 },
    { idx: 5, overallSuccess: "moderate", adROAS: 1.2, adSpend: 350000, adConversions: 4, orders: 2 },
    { idx: 6, overallSuccess: "success", adROAS: 5.1, adSpend: 200000, adConversions: 22, orders: 18 },
    { idx: 9, overallSuccess: "success", adROAS: 3.8, adSpend: 280000, adConversions: 14, orders: 10 },
  ];

  await Promise.all(
    feedbackData.map((fb) =>
      prisma.feedback.create({
        data: {
          productId: products[fb.idx].id,
          aiScoreAtSelection: 75 + Math.round(Math.random() * 20),
          overallSuccess: fb.overallSuccess,
          adPlatform: fb.idx % 2 === 0 ? "facebook" : "tiktok",
          adROAS: fb.adROAS,
          adSpend: fb.adSpend,
          adConversions: fb.adConversions,
          adImpressions: 15000 + Math.round(Math.random() * 30000),
          adClicks: 500 + Math.round(Math.random() * 1000),
          adCTR: 2 + Math.random() * 3,
          adCPC: 800 + Math.round(Math.random() * 500),
          orders: fb.orders,
          revenue: fb.orders * products[fb.idx].price,
          commissionEarned: fb.orders * products[fb.idx].commissionVND,
          salesPlatform: products[fb.idx].platform,
        },
      })
    )
  );

  console.log(`Created ${feedbackData.length} demo feedbacks`);

  // Create a learning log
  await prisma.learningLog.create({
    data: {
      weekNumber: 8,
      totalDataPoints: feedbackData.length,
      newDataPoints: feedbackData.length,
      currentAccuracy: 0.72,
      previousAccuracy: 0.65,
      weightsBefore: JSON.stringify({
        commission: 0.2,
        trending: 0.2,
        competition: 0.2,
        contentFit: 0.15,
        price: 0.15,
        platform: 0.1,
      }),
      weightsAfter: JSON.stringify({
        commission: 0.18,
        trending: 0.22,
        competition: 0.22,
        contentFit: 0.15,
        price: 0.13,
        platform: 0.1,
      }),
      patternsFound: JSON.stringify([
        "SP Beauty giá 200-400K convert tốt nhất trên TikTok organic (ROAS 4.2x)",
        "Health gadgets có trending >200% thường thành công với FB Ads",
        "SP có competition < 15 affiliates tỷ lệ thành công cao hơn 2.5x",
        "Giá 150-500K là sweet spot — conversion rate 3.8% vs 1.2% ngoài range",
      ]),
      insights:
        "Tuần này Beauty và Health tiếp tục outperform. Đề xuất tập trung SP giá 200-400K, ưu tiên TikTok Shop cho Beauty và FB Ads cho Health gadgets. Competition thấp (<15) là yếu tố predict mạnh nhất.",
      scoringVersion: "v1",
    },
  });

  console.log("Created 1 demo learning log");
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
