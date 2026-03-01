// Consistency QC — 5 rule-based checks against Character Bible
// Non-blocking: returns pass/warn, never blocks brief saving

import type { CharacterBibleData } from "./character-bible-types";

export interface QcCheck {
  check: string;
  status: "pass" | "warn";
  message: string;
}

export interface QcResult {
  overall: "pass" | "warn";
  checks: QcCheck[];
}

/** Fuzzy check if any catchphrase appears in text (case-insensitive, diacritics-tolerant) */
function containsPhrase(text: string, phrase: string): boolean {
  const normalizedText = text.toLowerCase().trim();
  const normalizedPhrase = phrase.toLowerCase().trim();
  // Direct substring match
  if (normalizedText.includes(normalizedPhrase)) return true;
  // Check first 4+ chars for partial match (handles slight variations)
  if (normalizedPhrase.length >= 4) {
    const core = normalizedPhrase.slice(0, Math.min(normalizedPhrase.length, 8));
    if (normalizedText.includes(core)) return true;
  }
  return false;
}

/** Count words in a string */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Run 5 consistency checks on a generated script
 * @param fullScript - The full_script text from generated brief
 * @param hook - The hook text
 * @param cta - The CTA text
 * @param bible - Character Bible data (null = skip character checks)
 */
export function runConsistencyQc(
  fullScript: string,
  hook: string,
  cta: string,
  bible: CharacterBibleData | null,
): QcResult {
  const checks: QcCheck[] = [];

  // Check 1: Catchphrase present (skip if no bible)
  if (bible?.catchphrases?.length) {
    const found = bible.catchphrases.some((cp) => containsPhrase(fullScript, cp));
    checks.push({
      check: "catchphrase",
      status: found ? "pass" : "warn",
      message: found
        ? "Có sử dụng catchphrase"
        : `Không tìm thấy catchphrase nào trong script. Nên dùng: "${bible.catchphrases[0]}"`,
    });
  }

  // Check 2: Hook length ≤ 15 words
  const hookWords = wordCount(hook);
  checks.push({
    check: "hook_length",
    status: hookWords <= 15 ? "pass" : "warn",
    message: hookWords <= 15
      ? `Hook ${hookWords} từ — OK`
      : `Hook ${hookWords} từ — nên ≤15 từ cho TikTok`,
  });

  // Check 3: Proof/evidence section exists
  const proofKeywords = [
    "test", "thử", "chứng minh", "kết quả", "before", "after",
    "so sánh", "đánh giá", "review", "trải nghiệm", "thực tế",
    "data", "số liệu", "bằng chứng",
  ];
  const hasProof = proofKeywords.some((kw) => fullScript.toLowerCase().includes(kw));
  checks.push({
    check: "proof_section",
    status: hasProof ? "pass" : "warn",
    message: hasProof
      ? "Có phần chứng minh/bằng chứng"
      : "Thiếu phần proof/bằng chứng — nên thêm test, so sánh, hoặc kết quả thực tế",
  });

  // Check 4: CTA pattern match
  const ctaPatterns = ["link", "bio", "giỏ hàng", "mua ngay", "comment", "follow", "save"];
  const hasCta = ctaPatterns.some((p) => cta.toLowerCase().includes(p));
  checks.push({
    check: "cta_pattern",
    status: hasCta ? "pass" : "warn",
    message: hasCta
      ? "CTA có call-to-action rõ ràng"
      : "CTA thiếu action rõ ràng — nên có: link ở bio, giỏ hàng, comment, follow",
  });

  // Check 5: Red line check (skip if no bible)
  if (bible?.redLines?.length) {
    const violated = bible.redLines.filter((rl) => containsPhrase(fullScript, rl));
    checks.push({
      check: "red_lines",
      status: violated.length === 0 ? "pass" : "warn",
      message: violated.length === 0
        ? "Không vi phạm red lines"
        : `Có thể vi phạm red line: "${violated[0]}"`,
    });
  }

  const overall = checks.some((c) => c.status === "warn") ? "warn" : "pass";
  return { overall, checks };
}
