"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ChannelOption {
  id: string;
  name: string;
  personaName: string;
}

interface Props {
  channels: ChannelOption[];
  currentChannelId?: string;
}

export function ChannelFilter({ channels, currentChannelId }: Props): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("channelId", value);
    } else {
      params.delete("channelId");
    }
    router.replace(`/insights?${params.toString()}`, { scroll: false });
  }

  if (channels.length === 0) return <></>;

  return (
    <select
      value={currentChannelId ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
    >
      <option value="">Tất cả kênh</option>
      {channels.map((ch) => (
        <option key={ch.id} value={ch.id}>
          {ch.name} ({ch.personaName})
        </option>
      ))}
    </select>
  );
}
