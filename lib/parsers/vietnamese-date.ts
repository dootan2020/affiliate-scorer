// Parse Vietnamese date strings exported by TikTok Studio
// Formats: "17 tháng Hai", "17 thg 2", "17/02/2025"

const VN_MONTHS: Record<string, number> = {
  Một: 0,
  Hai: 1,
  Ba: 2,
  Tư: 3,
  Năm: 4,
  Sáu: 5,
  Bảy: 6,
  Tám: 7,
  Chín: 8,
  Mười: 9,
  "Mười Một": 10,
  "Mười Hai": 11,
};

// "17 thg 2" shorthand mapping
const VN_MONTH_SHORT: Record<string, number> = {
  "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5,
  "7": 6, "8": 7, "9": 8, "10": 9, "11": 10, "12": 11,
};

export function parseVietnameseDate(text: string, referenceYear?: number): Date | null {
  if (!text) return null;

  const trimmed = text.trim();
  const year = referenceYear ?? new Date().getFullYear();

  // Format: "17/02/2025" or "02/17/2025"
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, a, b, y] = slashMatch;
    const d = new Date(Number(y), Number(b) - 1, Number(a));
    if (!isNaN(d.getTime())) return d;
  }

  // Format: "17 tháng Hai" — day + full month name
  // "Mười Một" and "Mười Hai" are compound — check first
  for (const [monthName, monthIdx] of Object.entries(VN_MONTHS).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    const pattern = new RegExp(
      `^(\\d{1,2})\\s+tháng\\s+${monthName}\\s*(\\d{4})?$`,
      "i",
    );
    const m = trimmed.match(pattern);
    if (m) {
      const day = Number(m[1]);
      const y = m[2] ? Number(m[2]) : year;
      const d = new Date(y, monthIdx, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Format: "17 thg 2" or "17 thg 12"
  const shortMatch = trimmed.match(/^(\d{1,2})\s+thg\s+(\d{1,2})\s*(\d{4})?$/i);
  if (shortMatch) {
    const [, dayStr, monthStr, yearStr] = shortMatch;
    const monthIdx = VN_MONTH_SHORT[monthStr];
    if (monthIdx !== undefined) {
      const d = new Date(yearStr ? Number(yearStr) : year, monthIdx, Number(dayStr));
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Fallback: try native Date parse
  const native = new Date(trimmed);
  if (!isNaN(native.getTime())) return native;

  return null;
}
