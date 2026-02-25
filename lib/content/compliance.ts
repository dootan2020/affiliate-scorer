// Phase 3: Compliance check — TikTok VN rules

const BLOCKLIST = [
  // Y tế
  "chữa bệnh", "trị bệnh", "khỏi bệnh", "thuốc chữa",
  "fda", "bộ y tế chứng nhận", "đã được bộ y tế",
  // So sánh tiêu cực
  "tốt hơn hẳn", "đừng mua brand",
  // Cam kết quá mức
  "100% hiệu quả", "cam kết hiệu quả", "đảm bảo kết quả",
  "chắc chắn có kết quả", "không hiệu quả hoàn tiền",
];

const SOFTLIST = [
  // Cần disclaimer
  "giảm cân", "trắng da", "trị mụn", "chống lão hóa",
  "làm sáng da", "se khít lỗ chân lông", "giảm thâm",
  "tăng cân", "tăng cơ", "giảm mỡ",
];

const DISCLAIMER = "Kết quả có thể khác nhau tùy cơ địa. Không phải sản phẩm y tế.";

export interface ComplianceHit {
  word: string;
  level: "blocked" | "warning";
}

export interface ComplianceResult {
  status: "passed" | "warning" | "blocked";
  hits: ComplianceHit[];
  requiresDisclaimer: boolean;
  disclaimer: string | null;
}

/** Kiểm tra text (script + caption) vi phạm TikTok VN rules */
export function checkCompliance(text: string): ComplianceResult {
  const lower = text.toLowerCase();
  const hits: ComplianceHit[] = [];

  for (const word of BLOCKLIST) {
    if (lower.includes(word.toLowerCase())) {
      hits.push({ word, level: "blocked" });
    }
  }

  for (const word of SOFTLIST) {
    if (lower.includes(word.toLowerCase())) {
      hits.push({ word, level: "warning" });
    }
  }

  const blocked = hits.some((h) => h.level === "blocked");
  const warning = hits.some((h) => h.level === "warning");

  return {
    status: blocked ? "blocked" : warning ? "warning" : "passed",
    hits,
    requiresDisclaimer: warning,
    disclaimer: warning ? DISCLAIMER : null,
  };
}
