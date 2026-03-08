// GET /api/settings/api-keys/telegram-info — fetch bot username from Telegram API
import { NextResponse } from "next/server";
import { getTelegramToken } from "@/lib/ai/providers";

export async function GET(): Promise<NextResponse> {
  try {
    const token = await getTelegramToken();
    if (!token) {
      return NextResponse.json({ botUsername: null });
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (!res.ok) {
      return NextResponse.json({ botUsername: null });
    }

    const data = (await res.json()) as { ok: boolean; result?: { username?: string } };
    return NextResponse.json(
      { botUsername: data.result?.username || null },
      { headers: { "Cache-Control": "private, max-age=3600" } }
    );
  } catch {
    return NextResponse.json({ botUsername: null });
  }
}
