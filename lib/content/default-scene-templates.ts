// Default scene templates for Video Bible
import type { SceneTemplateData } from "./video-bible-types";

export const DEFAULT_SCENE_TEMPLATES: SceneTemplateData[] = [
  {
    name: "PASS/FAIL Lab",
    slug: "pass-fail-lab",
    description: "Test sản phẩm với tiêu chí rõ ràng, kết quả PASS hoặc FAIL",
    blocks: [
      { blockType: "tension", label: "Hook + Giới thiệu", description: "Gây tò mò về sản phẩm cần test" },
      { blockType: "reveal", label: "Setup test", description: "Giới thiệu tiêu chí và cách test" },
      { blockType: "proof", label: "Thực hiện test", description: "Quay cận quá trình test" },
      { blockType: "payoff", label: "Kết quả", description: "Reveal kết quả PASS hoặc FAIL" },
      { blockType: "cta", label: "CTA", description: "Comment keyword để nhận thêm info" },
    ],
    defaultShotSequence: ["A1", "A2", "B1", "B2", "B3", "C1", "C2"],
    rules: { maxWords: 120, maxCuts: 8, subtitleStyle: "bold-bottom" },
  },
  {
    name: "Myth-bust",
    slug: "myth-bust",
    description: "Bóc trần hiểu lầm phổ biến về sản phẩm/ngách",
    blocks: [
      { blockType: "tension", label: "Myth", description: "Trình bày claim/hiểu lầm phổ biến" },
      { blockType: "reveal", label: "Truth", description: "Bóc trần sự thật đằng sau" },
      { blockType: "proof", label: "Chứng minh", description: "Bằng chứng / test / so sánh" },
      { blockType: "payoff", label: "Kết luận", description: "Tóm tắt, đưa lời khuyên" },
      { blockType: "cta", label: "CTA", description: "Follow để xem thêm myth-bust" },
    ],
    defaultShotSequence: ["A1", "B1", "B2", "B3", "C1", "C2"],
    rules: { maxWords: 100, maxCuts: 7 },
  },
  {
    name: "A vs B Compare",
    slug: "a-vs-b",
    description: "So sánh 2 sản phẩm theo tiêu chí cụ thể",
    blocks: [
      { blockType: "tension", label: "Giới thiệu 2 SP", description: "Show 2 sản phẩm, tạo tò mò" },
      { blockType: "proof", label: "So sánh 1", description: "Tiêu chí đầu tiên" },
      { blockType: "proof", label: "So sánh 2", description: "Tiêu chí thứ hai" },
      { blockType: "payoff", label: "Chốt chọn", description: "Chọn 1, giải thích vì sao" },
      { blockType: "cta", label: "CTA", description: "Comment SP nào bạn chọn" },
    ],
    defaultShotSequence: ["A1", "D1", "B4", "B4", "C1", "C2"],
    rules: { maxWords: 110, maxCuts: 8 },
  },
  {
    name: "Mini Drama",
    slug: "mini-drama",
    description: "Kịch ngắn với nhân vật phụ, tạo tình huống hài/drama",
    blocks: [
      { blockType: "tension", label: "Tình huống", description: "Nhân vật phụ gây ra vấn đề" },
      { blockType: "reveal", label: "Phản ứng", description: "Nhân vật chính phản biện/test" },
      { blockType: "proof", label: "Chứng minh", description: "Test/so sánh để kết thúc drama" },
      { blockType: "payoff", label: "Kết drama", description: "Ai đúng ai sai" },
      { blockType: "cta", label: "CTA", description: "Comment phe nào bạn theo" },
    ],
    defaultShotSequence: ["A1", "B1", "B2", "B3", "C1", "C2"],
    rules: { maxWords: 130, maxCuts: 10 },
  },
  {
    name: "Story / Trải nghiệm",
    slug: "story",
    description: "Kể câu chuyện cá nhân liên quan đến sản phẩm",
    blocks: [
      { blockType: "tension", label: "Vấn đề", description: "Bắt đầu bằng sai lầm/vấn đề đã gặp" },
      { blockType: "reveal", label: "Hành trình", description: "Quá trình tìm giải pháp" },
      { blockType: "proof", label: "Giải pháp", description: "Sản phẩm/cách giải quyết" },
      { blockType: "payoff", label: "Kết quả", description: "Kết quả sau khi áp dụng" },
      { blockType: "cta", label: "CTA", description: "Chia sẻ trải nghiệm tương tự" },
    ],
    defaultShotSequence: ["A1", "D2", "B1", "B3", "C1", "C2"],
    rules: { maxWords: 120, maxCuts: 7 },
  },
];
