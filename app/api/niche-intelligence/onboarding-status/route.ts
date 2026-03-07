import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    // Find the most recent NicheProfile with a selected niche
    const profile = await prisma.nicheProfile.findFirst({
      where: { selectedNiche: { not: null }, channelId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { id: true, selectedNiche: true, channelId: true },
    });

    if (!profile || !profile.channelId) {
      return NextResponse.json({ hasOnboarding: false });
    }

    // Check completion status of each onboarding step
    const [hasApiKeys, hasProducts, hasBriefs] = await Promise.all([
      prisma.apiProvider.count({ where: { isConnected: true } }).then((c) => c > 0),
      prisma.productIdentity.count().then((c) => c > 0),
      prisma.contentBrief.count({ where: { channelId: profile.channelId } }).then((c) => c > 0),
    ]);

    return NextResponse.json({
      hasOnboarding: true,
      channelId: profile.channelId,
      niche: profile.selectedNiche,
      steps: {
        apiKeys: hasApiKeys,
        syncProducts: hasProducts,
        generateBrief: hasBriefs,
      },
    });
  } catch (error) {
    console.error("[onboarding-status] Error:", error);
    return NextResponse.json({ hasOnboarding: false });
  }
}
