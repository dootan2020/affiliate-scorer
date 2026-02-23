import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** B4: Seasonal tag presets */
const SEASONAL_PRESETS: Record<string, { start: string; end: string; label: string }> = {
  tet: { start: "01-15", end: "02-15", label: "Tết" },
  valentine: { start: "02-01", end: "02-14", label: "Valentine" },
  women_day: { start: "02-20", end: "03-08", label: "8/3" },
  summer: { start: "04-01", end: "08-31", label: "Mùa hè" },
  back_to_school: { start: "08-01", end: "09-15", label: "Tựu trường" },
  halloween: { start: "10-01", end: "10-31", label: "Halloween" },
  singles_day: { start: "11-01", end: "11-11", label: "11/11" },
  christmas: { start: "12-01", end: "12-25", label: "Giáng sinh" },
};

interface SeasonalBody {
  tag: string | null;
  preset?: string;
  startDate?: string;
  endDate?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as SeasonalBody;

    // Clear seasonal tag
    if (body.tag === null) {
      await prisma.product.update({
        where: { id },
        data: {
          seasonalTag: null,
          sellWindowStart: null,
          sellWindowEnd: null,
        },
      });
      return NextResponse.json({ message: "Đã xóa tag mùa vụ" });
    }

    const year = new Date().getFullYear();
    let start: Date;
    let end: Date;
    let tag: string;

    if (body.preset && SEASONAL_PRESETS[body.preset]) {
      const preset = SEASONAL_PRESETS[body.preset];
      tag = preset.label;
      start = new Date(`${year}-${preset.start}`);
      end = new Date(`${year}-${preset.end}`);
      // Handle cross-year (e.g., Tết spans Jan-Feb)
      if (end < start) end.setFullYear(year + 1);
    } else if (body.startDate && body.endDate) {
      tag = body.tag;
      start = new Date(body.startDate);
      end = new Date(body.endDate);
    } else {
      return NextResponse.json(
        { error: "Cần preset hoặc startDate + endDate" },
        { status: 400 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: {
        seasonalTag: tag,
        sellWindowStart: start,
        sellWindowEnd: end,
      },
    });

    return NextResponse.json({
      message: `Đã đánh dấu mùa vụ: ${tag}`,
      data: { tag, start, end },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
