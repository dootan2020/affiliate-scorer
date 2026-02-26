import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasKey = !!apiKey && apiKey !== "sk-ant-..." && apiKey.length > 10;
  const maskedKey = hasKey ? "••••••••" + apiKey.slice(-4) : null;

  return NextResponse.json({
    data: {
      hasKey,
      maskedKey,
    },
  });
}
