// Phase 02: Rubric-Anchored AI Scoring Prompts
// 4 criteria with explicit 5-tier rubric (20/40/60/80/100)
// Token-efficient: only send fields AI needs for qualitative judgment

import type { Product as ProductModel } from "@/lib/types/product";

export interface WeightMap {
  commission: number;
  trending: number;
  competition: number;
  priceAppeal: number;
  salesVelocity: number;
}

export interface ScoringPromptInput {
  products: ProductModel[];
  weights: WeightMap;
  patterns?: string[];
}

export interface LearningPromptInput {
  feedbackSummary: string;
  currentWeights: WeightMap;
  previousPatterns?: string[];
}

export interface RecommendPromptInput {
  productName: string;
  category: string;
  price: number;
  commissionRate: number;
  platform: string;
}

/** Build token-efficient product context for AI scoring */
function buildProductContext(products: ProductModel[]): string {
  return JSON.stringify(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      commissionRate: p.commissionRate,
      sales7d: p.sales7d,
      totalKOL: p.totalKOL,
      shopRating: p.shopRating,
      platform: p.platform,
    })),
  );
}

export function buildScoringPrompt(input: ScoringPromptInput): {
  system: string;
  user: string;
} {
  const { products } = input;

  const system = `Ban la chuyen gia affiliate marketing TikTok Shop Viet Nam voi 5+ nam kinh nghiem.
Danh gia san pham cho creator muon lam video ban hang affiliate.

QUAN TRONG: Cham diem CHINH XAC theo rubric duoi day. Dung cho diem cao qua de dang.
Diem trung binh nen khoang 50-60. Chi SP that su xuat sac moi dat 80+.

## Rubric cham diem (moi tieu chi 1-5 sao):

### 1. Nhu cau thi truong (market_demand) — SP co nguoi muon mua khong?
20: SP ngach rat hep, it ai can, khong trending
40: Co nhu cau nhung khong noi bat, thi truong bao hoa
60: Nhu cau on, co tim kiem, phu hop mot segment
80: Nhu cau cao, dang hot, nhieu nguoi tim kiem
100: Viral potential, giai quyet pain point pho bien, trending manh

### 2. Chat luong & uy tin (quality_trust) — SP co dang tin khong?
20: Khong ro nguon goc, mo ta so sai, co dau hieu hang kem chat luong
40: SP tam duoc nhung khong noi bat, review trung binh
60: SP on, co thuong hieu nho, mo ta ro rang
80: SP tot, thuong hieu uy tin, review tot, co chung nhan
100: SP xuat sac, top thuong hieu, best-seller nganh

### 3. Tiem nang viral (viral_potential) — De lam video hay khong?
20: Nham chan, kho demo, khong co wow factor
40: Co the demo nhung video se binh thuong
60: Co goc content hap dan, before/after kha
80: De viral — reaction manh, transformation ro, visual dep
100: Chac chan viral — wow factor cuc manh, trigger cam xuc

### 4. Rui ro (risk) — Ban SP nay co rui ro gi?
20: Rui ro cao — claim y te, de hoan, chat cam, de bi report
40: Co rui ro — SP nhay cam, ty le hoan cao, canh tranh gia khoc liet
60: Rui ro trung binh — SP binh thuong, khong van de lon
80: Rui ro thap — SP an toan, it hoan, category on dinh
100: Gan nhu khong rui ro — SP thiet yeu, repeat purchase, uy tin cao

Tra ve JSON array, KHONG text them. Moi SP:`;

  const outputFormat = `[{
  "id": "product_id",
  "scores": {
    "market_demand": 60,
    "quality_trust": 40,
    "viral_potential": 80,
    "risk": 60
  },
  "aiScore": 58,
  "reason": "1-2 cau giai thich diem so",
  "contentAngle": "Goc video hay nhat cho SP nay"
}]

QUAN TRONG:
- aiScore = TRUNG BINH CO TRONG SO: market_demand*0.35 + quality_trust*0.25 + viral_potential*0.25 + risk*0.15
- Moi tieu chi CHI cho 20/40/60/80/100 (5 muc, khong so le)
- Diem TRUNG BINH cua toan batch nen khoang 50-60, KHONG phai 70-80`;

  const anchorExamples = `
VI DU THAM KHAO (de calibrate diem):

SP 85 diem — Noi chien khong dau Xiaomi 5.5L, gia 890K, commission 15%:
  market_demand=80, quality_trust=80, viral_potential=100, risk=80
  → Nhu cau cao, thuong hieu Xiaomi uy tin, de demo truoc/sau, an toan

SP 55 diem — Op lung iPhone silicon, gia 25K, commission 30%:
  market_demand=60, quality_trust=40, viral_potential=40, risk=80
  → Nhu cau co nhung canh tranh khoc liet, chat luong tam, kho lam video hay, nhung an toan

SP 27 diem — Vien giam can thao duoc XYZ, gia 350K, commission 40%:
  market_demand=40, quality_trust=20, viral_potential=20, risk=20
  → aiScore = 40*0.35 + 20*0.25 + 20*0.25 + 20*0.15 = 27
  → Co nguoi tim nhung nhay cam, khong ro nguon goc, kho demo, rui ro cao bi report`;

  const user = `Cham diem cho ${products.length} san pham:

${anchorExamples}

Du lieu san pham:
${buildProductContext(products)}

Format tra ve:
${outputFormat}`;

  return { system, user };
}

export function buildLearningPrompt(input: LearningPromptInput): {
  system: string;
  user: string;
} {
  const { feedbackSummary, currentWeights, previousPatterns } = input;

  const system = `Ban la AI phan tich hieu suat affiliate marketing tai Viet Nam.
Phan tich du lieu feedback thuc te de tim patterns va de xuat dieu chinh trong so scoring.
Luon tra ve JSON hop le.`;

  const user = `Phan tich du lieu feedback sau va de xuat cai thien:

Trong so hien tai:
${JSON.stringify(currentWeights, null, 2)}

${previousPatterns && previousPatterns.length > 0 ? `Patterns cu:\n${previousPatterns.join("\n")}\n` : ""}

Du lieu feedback:
${feedbackSummary}

Tra ve JSON:
{
  "accuracy": 0.75,
  "patterns": ["Pattern 1", "Pattern 2"],
  "weightAdjustments": {
    "commission": 0.25,
    "trending": 0.25,
    "competition": 0.20,
    "priceAppeal": 0.15,
    "salesVelocity": 0.15
  },
  "insights": "Tom tat phan tich va chien luoc de xuat."
}`;

  return { system, user };
}

export function buildRecommendPrompt(input: RecommendPromptInput): {
  system: string;
  user: string;
} {
  const { productName, category, price, commissionRate, platform } = input;

  const system = `Ban la chuyen gia content marketing affiliate tai Viet Nam.
De xuat chien luoc noi dung cu the de quang ba san pham hieu qua.
Luon tra ve JSON hop le.`;

  const user = `De xuat chien luoc noi dung cho san pham:
- Ten: ${productName}
- Danh muc: ${category}
- Gia: ${price.toLocaleString("vi-VN")} VND
- Hoa hong: ${commissionRate}%
- Platform: ${platform}

Tra ve JSON:
{
  "videoType": "Review / Unboxing / Tutorial / So sanh",
  "duration": "60-90 giay",
  "postTime": "19:00-21:00 toi thu 6-7",
  "adsBudget": "500K-1M/ngay",
  "expectedROAS": "3-5x",
  "hooks": ["Hook mo dau 1", "Hook mo dau 2"],
  "keyPoints": ["Diem ban hang 1", "Diem ban hang 2"],
  "cta": "Keu goi hanh dong phu hop"
}`;

  return { system, user };
}
