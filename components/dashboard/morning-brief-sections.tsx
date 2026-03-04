"use client";

import Link from "next/link";
import { Sparkles, Calendar, Zap } from "lucide-react";
import type { ChannelProductMatch, EventProductBoost } from "@/lib/brief/brief-types";

// --- V2: Channel Product Match (grouped by channel) ---

export function ChannelProductMatchSection({
  matches,
}: {
  matches: ChannelProductMatch[];
}): React.ReactElement {
  return (
    <div className="space-y-3">
      {matches.map((ch) => (
        <div key={ch.channelId} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/channels/${ch.channelId}`}
              className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
            >
              {ch.channelName}
            </Link>
            <span className="text-[10px] text-gray-400">{ch.products.length} SP</span>
          </div>
          {ch.products.map((p, i) => (
            <div
              key={`cpm-${ch.channelId}-${i}`}
              className="flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 px-3 py-2"
            >
              <span className="text-xs font-medium text-gray-400 mt-0.5 w-4 shrink-0">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.productId ? (
                    <Link
                      href={`/inbox/${p.productId}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {p.product}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {p.product}
                    </span>
                  )}
                  <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-1.5 py-0.5 rounded-full">
                    {p.videos} video
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      p.tag === "proven"
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                    }`}
                  >
                    {p.tag === "proven" ? "Đã chứng minh" : "Khám phá"}
                  </span>
                  {p.productId && (
                    <Link
                      href={`/production?productId=${p.productId}&channelId=${ch.channelId}`}
                      className="text-[10px] text-orange-500 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                    >
                      Brief →
                    </Link>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {p.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- V2: Event Product Boost ---

export function EventProductBoostSection({
  boosts,
}: {
  boosts: EventProductBoost[];
}): React.ReactElement {
  return (
    <div className="space-y-2">
      {boosts.map((evt, i) => (
        <div
          key={`epb-${i}`}
          className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20 px-3 py-2.5 space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="text-sm text-gray-900 dark:text-gray-50 font-medium">
              {evt.event}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              {evt.date}
            </span>
          </div>
          {evt.products.length > 0 && (
            <div className="ml-5.5 space-y-1">
              {evt.products.map((p, j) => (
                <div key={`epb-p-${i}-${j}`} className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  {p.productId ? (
                    <Link
                      href={`/inbox/${p.productId}`}
                      className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {p.product}
                    </Link>
                  ) : (
                    <span className="text-gray-700 dark:text-gray-300">{p.product}</span>
                  )}
                  <span className="text-gray-400">— {p.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- V2: Pattern Highlight ---

export function PatternHighlightCard({
  highlight,
}: {
  highlight: string;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 px-3 py-2.5">
      <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-0.5">
          Pattern đang thắng
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-300">{highlight}</p>
      </div>
    </div>
  );
}
