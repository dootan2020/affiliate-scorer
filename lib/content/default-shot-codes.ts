// Default shot codes for Video Bible shot library
import type { ShotCodeData } from "./video-bible-types";

export const DEFAULT_SHOT_CODES: ShotCodeData[] = [
  // A-series: Opening / Hook
  {
    code: "A1",
    name: "Hook Talking Head",
    description: "Medium shot, nói hook câu đầu tiên gây tò mò",
    durationHint: "1-3s",
    camera: "medium",
    sortOrder: 1,
  },
  {
    code: "A2",
    name: "Hook Close-up Product",
    description: "Cận sản phẩm gây tò mò, chưa reveal hết",
    durationHint: "1-2s",
    camera: "close-up",
    sortOrder: 2,
  },
  // B-series: Body / Test / Proof
  {
    code: "B1",
    name: "Test Setup",
    description: "Giới thiệu cách test / tiêu chí đánh giá",
    durationHint: "3-5s",
    camera: "medium",
    sortOrder: 3,
  },
  {
    code: "B2",
    name: "Test Action",
    description: "Thực hiện test, quay cận quá trình",
    durationHint: "5-8s",
    camera: "close-up",
    sortOrder: 4,
  },
  {
    code: "B3",
    name: "Result Reveal",
    description: "Kết quả test / so sánh before-after",
    durationHint: "3-5s",
    camera: "close-up",
    sortOrder: 5,
  },
  {
    code: "B4",
    name: "Comparison Side-by-Side",
    description: "So sánh 2 sản phẩm hoặc before/after cạnh nhau",
    durationHint: "3-5s",
    camera: "wide",
    sortOrder: 6,
  },
  // C-series: Conclusion / CTA
  {
    code: "C1",
    name: "Verdict / PASS-FAIL",
    description: "Đưa ra kết luận cuối cùng, đóng dấu PASS/FAIL",
    durationHint: "2-3s",
    camera: "medium",
    sortOrder: 7,
  },
  {
    code: "C2",
    name: "CTA + Keyword",
    description: "Kêu gọi comment keyword, follow, hoặc link bio",
    durationHint: "2-3s",
    camera: "medium",
    sortOrder: 8,
  },
  // D-series: B-Roll / Insert
  {
    code: "D1",
    name: "Product B-Roll",
    description: "Quay sản phẩm xoay, mở hộp, cận chi tiết",
    durationHint: "2-3s",
    camera: "close-up",
    sortOrder: 9,
  },
  {
    code: "D2",
    name: "Environment / Context",
    description: "Bối cảnh sử dụng sản phẩm (bếp, bàn, phòng)",
    durationHint: "2-3s",
    camera: "wide",
    sortOrder: 10,
  },
];
