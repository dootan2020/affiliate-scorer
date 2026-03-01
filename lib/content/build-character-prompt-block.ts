// Build prompt blocks from Character Bible + Format Template for brief generation
import type { CharacterBibleData } from "./character-bible-types";
import type { FormatTemplateData } from "./format-template-types";

/** Build character context block for AI brief prompt */
export function buildCharacterBlock(bible: CharacterBibleData): string {
  const parts: string[] = [];

  parts.push("CHARACTER BIBLE (nhân vật này phải NHẤT QUÁN trong mọi video):");

  // Core beliefs + red lines
  if (bible.coreValues?.length) {
    parts.push(`\nNIỀM TIN CỐT LÕI:\n${bible.coreValues.map((v, i) => `  ${i + 1}. ${v}`).join("\n")}`);
  }
  if (bible.redLines?.length) {
    parts.push(`\nRED LINES (TUYỆT ĐỐI KHÔNG):\n${bible.redLines.map((r) => `  - ${r}`).join("\n")}`);
  }

  // Catchphrases — must appear in scripts
  if (bible.catchphrases?.length) {
    parts.push(`\nCÂU CỬA MIỆNG (phải dùng ít nhất 1 trong script):\n${bible.catchphrases.map((c) => `  - "${c}"`).join("\n")}`);
  }

  // Voice DNA
  if (bible.voiceDna) {
    parts.push(`\nVOICE DNA:\n  - Tone: ${bible.voiceDna.tone}\n  - Nhịp: ${bible.voiceDna.pace}\n  - Signature: ${bible.voiceDna.signature}`);
  }

  // Relationships — for dialogue/react content
  if (bible.relationships?.length) {
    parts.push(`\nNHÂN VẬT PHỤ (có thể xuất hiện trong script):`);
    for (const r of bible.relationships) {
      parts.push(`  - ${r.name} (${r.role}): "${r.catchphrase}" — ${r.dynamic}`);
    }
  }

  // World rules — content constraints
  if (bible.worldRules?.length) {
    parts.push(`\nLUẬT THẾ GIỚI (tạo tình huống tự nhiên):`);
    for (const w of bible.worldRules) {
      parts.push(`  - ${w.rule} → ${w.effect}`);
    }
  }

  // Origin — for story-type content
  if (bible.originWound || bible.originVow) {
    parts.push(`\nCÂU CHUYỆN GỐC:`);
    if (bible.originWound) parts.push(`  - Wound: ${bible.originWound}`);
    if (bible.originVow) parts.push(`  - Vow: ${bible.originVow}`);
    if (bible.originSymbol) parts.push(`  - Symbol: ${bible.originSymbol}`);
  }

  // Inside jokes
  if (bible.insideJokes?.length) {
    parts.push(`\nINSIDE JOKES (tham chiếu nếu phù hợp):\n${bible.insideJokes.map((j) => `  - "${j}"`).join("\n")}`);
  }

  // Rituals
  if (bible.rituals?.length) {
    parts.push(`\nRITUAL (hành động lặp lại):\n${bible.rituals.map((r) => `  - ${r}`).join("\n")}`);
  }

  parts.push(`\n→ Script PHẢI thể hiện tính cách nhân vật, dùng catchphrase, tuân thủ red lines.`);

  return parts.join("\n");
}

/** Build format structure block for AI brief prompt */
export function buildFormatBlock(format: FormatTemplateData): string {
  const parts: string[] = [];

  parts.push(`FORMAT: ${format.name} (${format.slug})`);
  if (format.goal) parts.push(`Mục tiêu: ${format.goal}`);

  parts.push("\nCẤU TRÚC BẮT BUỘC:");
  if (format.hookTemplate) parts.push(`  HOOK: ${format.hookTemplate}`);
  if (format.bodyTemplate) parts.push(`  BODY: ${format.bodyTemplate}`);
  if (format.proofTemplate) parts.push(`  PROOF: ${format.proofTemplate}`);
  if (format.ctaTemplate) parts.push(`  CTA: ${format.ctaTemplate}`);

  if (format.exampleScript) {
    parts.push(`\nVÍ DỤ THAM KHẢO:\n  ${format.exampleScript}`);
  }

  parts.push(`\n→ Tất cả 3 scripts PHẢI theo format "${format.name}", mỗi script khác angle/hook.`);

  return parts.join("\n");
}
