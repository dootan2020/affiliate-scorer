import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  PROVIDER_NAMES,
  PROVIDER_CONFIGS,
  type ProviderName,
  maskKey,
} from "@/lib/ai/providers";
import { decrypt } from "@/lib/encryption";

interface ProviderStatus {
  provider: ProviderName;
  connected: boolean;
  fromEnv: boolean;
  lastChars: string | null;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Get all DB records
    const dbRecords = await prisma.apiProvider.findMany();
    const dbMap = new Map(dbRecords.map((r) => [r.provider, r]));

    const providers: ProviderStatus[] = PROVIDER_NAMES.map((provider) => {
      const config = PROVIDER_CONFIGS[provider];
      const dbRecord = dbMap.get(provider);

      // Check env var first
      const envKey = process.env[config.envVar];
      const hasEnvKey = !!envKey && envKey.length > 10 && envKey !== config.keyHint;

      if (hasEnvKey) {
        return {
          provider,
          connected: true,
          fromEnv: true,
          lastChars: maskKey(envKey),
        };
      }

      // Check DB
      if (dbRecord?.encryptedKey && dbRecord.isConnected) {
        try {
          const decryptedKey = decrypt(dbRecord.encryptedKey);
          return {
            provider,
            connected: true,
            fromEnv: false,
            lastChars: maskKey(decryptedKey),
          };
        } catch {
          // Decryption failed — key is invalid
        }
      }

      return {
        provider,
        connected: false,
        fromEnv: false,
        lastChars: null,
      };
    });

    return NextResponse.json({ providers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi" },
      { status: 500 }
    );
  }
}
