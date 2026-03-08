// Win Predictor API — formula-based win probability for (product, channel) pair
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { predictWin } from "@/lib/agents/win-predictor";

const schema = z.object({
  productId: z.string().min(1),
  channelId: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Cần productId và channelId", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const prediction = await predictWin(parsed.data.productId, parsed.data.channelId);
    return NextResponse.json({ data: prediction });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[agents/predict-win]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
