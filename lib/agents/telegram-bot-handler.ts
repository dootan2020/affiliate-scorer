// Telegram Bot Handler — captures competitor TikTok videos for trend analysis
import { prisma } from "@/lib/db";
import { fetchTikTokOembed } from "@/lib/agents/tiktok-oembed";
import { getTelegramToken } from "@/lib/ai/providers";

export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number };
  };
  callback_query?: {
    id: string;
    data: string;
    message: { chat: { id: number } };
  };
}

export interface BotResponse {
  chatId: number;
  text: string;
  replyMarkup?: unknown;
}

const TIKTOK_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[\w.]+\/video\/\d+|vm\.tiktok\.com\/[\w]+|vn\.tiktok\.com\/[\w]+)/i;

/**
 * Handle incoming Telegram update. Returns response to send, or null if no response needed.
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<BotResponse | null> {
  // Handle callback query (inline keyboard button press)
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const data = update.callback_query.data;

    if (data.startsWith("channel:")) {
      const channelId = data.replace("channel:", "");
      await setActiveChannel(String(chatId), channelId);
      const channel = await prisma.tikTokChannel.findUnique({
        where: { id: channelId },
        select: { name: true },
      });
      return { chatId, text: `Đã chọn kênh: ${channel?.name || channelId}` };
    }
    return null;
  }

  if (!update.message?.text) return null;

  const chatId = update.message.chat.id;
  const text = update.message.text.trim();

  // /start command
  if (text === "/start") {
    return {
      chatId,
      text: `Chào bạn! Tôi là PASTR Bot.\n\nGửi link TikTok để lưu video đối thủ.\n\nLệnh:\n/channel — Chọn kênh\n/status — Xem số video đã lưu hôm nay\n\nBắt đầu: gõ /channel để chọn kênh trước.`,
    };
  }

  // /channel command
  if (text.startsWith("/channel")) {
    const channels = await prisma.tikTokChannel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, niche: true },
      take: 10,
    });

    if (channels.length === 0) {
      return { chatId, text: "Chưa có kênh nào. Tạo kênh trước trên web." };
    }

    // If channel name provided as argument
    const arg = text.replace("/channel", "").trim();
    if (arg) {
      const found = channels.find((c) => c.name.toLowerCase().includes(arg.toLowerCase()));
      if (found) {
        await setActiveChannel(String(chatId), found.id);
        return { chatId, text: `Đã chọn kênh: ${found.name}` };
      }
      return { chatId, text: `Không tìm thấy kênh "${arg}". Gõ /channel để xem danh sách.` };
    }

    // Show inline keyboard
    return {
      chatId,
      text: "Chọn kênh:",
      replyMarkup: {
        inline_keyboard: channels.map((c) => [
          { text: `${c.name} (${c.niche})`, callback_data: `channel:${c.id}` },
        ]),
      },
    };
  }

  // /status command
  if (text === "/status") {
    const chat = await getOrCreateChat(String(chatId));
    if (!chat.activeChannelId) {
      return { chatId, text: "Chưa chọn kênh. Gõ /channel trước." };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await prisma.competitorCapture.count({
      where: { channelId: chat.activeChannelId, createdAt: { gte: todayStart } },
    });

    const channel = await prisma.tikTokChannel.findUnique({
      where: { id: chat.activeChannelId },
      select: { name: true },
    });

    return { chatId, text: `Kênh: ${channel?.name}\nĐã lưu hôm nay: ${count} video` };
  }

  // Check for TikTok URL
  const urlMatch = text.match(TIKTOK_URL_REGEX);
  if (urlMatch) {
    const tiktokUrl = urlMatch[0];
    const chat = await getOrCreateChat(String(chatId));

    if (!chat.activeChannelId) {
      return { chatId, text: "Chưa chọn kênh. Gõ /channel trước, rồi gửi link." };
    }

    // Rate limit: max 50/day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.competitorCapture.count({
      where: { channelId: chat.activeChannelId, createdAt: { gte: todayStart } },
    });
    if (todayCount >= 50) {
      return { chatId, text: "Đã đạt giới hạn 50 video/ngày. Thử lại ngày mai." };
    }

    // Fetch oembed
    const oembed = await fetchTikTokOembed(tiktokUrl);

    // Save capture
    await prisma.competitorCapture.create({
      data: {
        channelId: chat.activeChannelId,
        tiktokUrl,
        authorHandle: oembed?.authorName || null,
        caption: oembed?.caption || null,
        hashtags: oembed?.hashtags || [],
        thumbnailUrl: oembed?.thumbnailUrl || null,
      },
    });

    const channel = await prisma.tikTokChannel.findUnique({
      where: { id: chat.activeChannelId },
      select: { name: true },
    });

    const authorInfo = oembed?.authorName ? ` (@${oembed.authorName})` : "";
    return { chatId, text: `Đã lưu cho ${channel?.name}${authorInfo}` };
  }

  // Default help
  return {
    chatId,
    text: "Gửi link TikTok để lưu, hoặc dùng:\n/channel — Chọn kênh\n/status — Xem thống kê",
  };
}

/**
 * Send message via Telegram Bot API.
 */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: unknown
): Promise<void> {
  const token = await getTelegramToken();
  if (!token) {
    console.warn("[telegram] Telegram Bot Token not configured (DB or env)");
    return;
  }

  const body: Record<string, unknown> = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getOrCreateChat(chatId: string) {
  return prisma.telegramChat.upsert({
    where: { chatId },
    create: { chatId },
    update: {},
  });
}

async function setActiveChannel(chatId: string, channelId: string): Promise<void> {
  await prisma.telegramChat.upsert({
    where: { chatId },
    create: { chatId, activeChannelId: channelId },
    update: { activeChannelId: channelId },
  });
}
