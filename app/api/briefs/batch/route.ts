// Phase 3: POST /api/briefs/batch — Generate briefs cho nhiều SP cùng lúc
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBrief } from "@/lib/content/generate-brief";
import type { BriefOptions, ChannelContext } from "@/lib/content/generate-brief";
import { validateBody } from "@/lib/validations/validate-body";
import { batchBriefSchema } from "@/lib/validations/schemas-content";
import { createTask, updateTaskProgress, completeTask, failTask } from "@/lib/services/background-task";
import { selectHooksForBrief, selectFormatsForBrief } from "@/lib/learning/explore-exploit";

interface BatchResult {
  productIdentityId: string;
  title: string | null;
  briefId: string | null;
  assetsCreated: number;
  status: "success" | "error";
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let taskId: string | null = null;

  try {
    const validation = await validateBody(request, batchBriefSchema);
    if (validation.error) return validation.error;
    const { productIdentityIds, channelId, contentType, videoFormat, targetDuration } = validation.data;

    // Build channel context (channelId is required)
    const channel = await prisma.tikTokChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      return NextResponse.json(
        { error: "Không tìm thấy kênh. Vui lòng chọn kênh hợp lệ." },
        { status: 404 },
      );
    }
    if (!channel.isActive) {
      return NextResponse.json(
        { error: "Kênh đã tạm dừng. Chọn kênh khác hoặc kích hoạt lại kênh." },
        { status: 400 },
      );
    }
    const channelCtx: ChannelContext = {
      channelId: channel.id,
      personaName: channel.personaName,
      personaDesc: channel.personaDesc,
      voiceStyle: channel.voiceStyle,
      targetAudience: channel.targetAudience,
      editingStyle: channel.editingStyle,
      niche: channel.niche,
    };

    // Fetch character bible + optional format template + video bible
    const { formatSlug } = validation.data;
    const [characterBible, formatTemplate, videoBible] = await Promise.all([
      prisma.characterBible.findUnique({ where: { channelId } }),
      formatSlug
        ? prisma.formatTemplate.findUnique({ where: { channelId_slug: { channelId, slug: formatSlug } } })
        : null,
      prisma.videoBible.findUnique({ where: { channelId } }),
    ]);

    // Fetch calendar events (7-day window) + explore/exploit selections
    const [calendarEvents, suggestedHooks, suggestedFormats] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          startDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 86_400_000),
          },
        },
        orderBy: { startDate: "asc" },
        take: 5,
        select: { name: true, startDate: true, eventType: true },
      }),
      selectHooksForBrief(0.3, channelId),
      selectFormatsForBrief(3, channelId),
    ]);

    const briefOptions: BriefOptions = {
      channel: channelCtx,
      contentType,
      videoFormat,
      targetDuration,
      characterBible: characterBible as unknown as import("@/lib/content/character-bible-types").CharacterBibleData | null,
      formatTemplate: formatTemplate as unknown as import("@/lib/content/format-template-types").FormatTemplateData | null,
      videoBible: videoBible as unknown as Record<string, unknown> | null,
      bibleVersion: characterBible?.version ?? null,
      videoBibleVersion: videoBible?.version ?? null,
      calendarEvents,
      suggestedHooks: suggestedHooks.map((h) => ({
        type: h.type,
        template: h.template,
        example: h.example,
      })),
      suggestedFormats: suggestedFormats.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
      })),
    };

    // Lấy tất cả identities + product data cho enriched prompt
    const identities = await prisma.productIdentity.findMany({
      where: { id: { in: productIdentityIds } },
      include: {
        product: {
          select: { shopRating: true, salesTotal: true, sales7d: true },
        },
      },
    });

    if (identities.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm nào" },
        { status: 404 },
      );
    }

    // Create background task for tracking
    const total = identities.length;
    taskId = await createTask({
      type: "brief_batch",
      label: `Đang tạo ${total} briefs...`,
    });

    // Generate briefs tuần tự (tránh rate limit Claude API)
    const results: BatchResult[] = [];

    for (let i = 0; i < identities.length; i++) {
      const identity = identities[i];
      try {
        const briefId = await generateBrief({
          id: identity.id,
          title: identity.title,
          category: identity.category,
          price: identity.price ? Number(identity.price) : null,
          commissionRate: identity.commissionRate ? String(identity.commissionRate) : null,
          description: identity.description,
          imageUrl: identity.imageUrl,
          shopName: identity.shopName,
          shopRating: identity.product?.shopRating ? Number(identity.product.shopRating) : null,
          salesTotal: identity.product?.salesTotal ?? null,
          combinedScore: identity.combinedScore ? Number(identity.combinedScore) : null,
          lifecycleStage: identity.lifecycleStage,
          deltaType: identity.deltaType,
        }, briefOptions);

        const assetCount = await prisma.contentAsset.count({
          where: { briefId },
        });

        results.push({
          productIdentityId: identity.id,
          title: identity.title,
          briefId,
          assetsCreated: assetCount,
          status: "success",
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Lỗi không xác định";
        results.push({
          productIdentityId: identity.id,
          title: identity.title,
          briefId: null,
          assetsCreated: 0,
          status: "error",
          error: errMsg,
        });
      }

      // Update task progress after each brief
      const done = i + 1;
      const pct = Math.round((done / total) * 100);
      await updateTaskProgress(taskId, pct, `${done}/${total} briefs`).catch(() => {});
    }

    const success = results.filter((r) => r.status === "success").length;
    const totalAssets = results.reduce((sum, r) => sum + r.assetsCreated, 0);

    // Finalize task
    if (success === total) {
      await completeTask(taskId, `${success} briefs, ${totalAssets} assets`).catch(() => {});
    } else if (success > 0) {
      await completeTask(taskId, `${success}/${total} thành công`).catch(() => {});
    } else {
      await failTask(taskId, "Tất cả briefs thất bại").catch(() => {});
    }

    return NextResponse.json({
      data: results,
      message: `${success}/${identities.length} briefs tạo thành công, ${totalAssets} assets`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[briefs/batch]", message);
    if (taskId) await failTask(taskId, message).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
