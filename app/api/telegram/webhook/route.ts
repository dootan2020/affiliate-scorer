// Telegram Bot Webhook — receives messages from Telegram
import { NextResponse } from "next/server";
import { handleTelegramUpdate, sendTelegramMessage, type TelegramUpdate } from "@/lib/agents/telegram-bot-handler";
import { getTelegramToken } from "@/lib/ai/providers";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verify bot token is configured (DB or env)
    const token = await getTelegramToken();
    if (!token) {
      return NextResponse.json({ ok: true }); // Silent — not configured
    }

    // Verify webhook secret (prevents forged requests)
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
      return NextResponse.json({ ok: true }); // Silent reject
    }

    const update = (await request.json()) as TelegramUpdate;
    const response = await handleTelegramUpdate(update);

    if (response) {
      await sendTelegramMessage(response.chatId, response.text, response.replyMarkup);
    }

    // Always return 200 to Telegram (prevents retry storm)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telegram/webhook]", error);
    return NextResponse.json({ ok: true });
  }
}
