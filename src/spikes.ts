import type { SpikeStats, StarEvent } from "./types.js";

// Pure. Organic stars trickle in; bought stars arrive in a wall — hundreds in an
// hour, thousands in a day. This buckets the sampled stars by hour and day and
// surfaces the biggest burst.

export function computeSpikes(events: StarEvent[]): SpikeStats {
  const byHour = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const e of events) {
    const hour = e.starredAt.slice(0, 13); // 2026-06-12T03
    const day = e.starredAt.slice(0, 10); // 2026-06-12
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const sampled = events.length;

  let peakHour = 0;
  let burstHour = "";
  for (const [h, c] of byHour) if (c > peakHour) ((peakHour = c), (burstHour = h));

  let peakDay = 0;
  for (const c of byDay.values()) if (c > peakDay) peakDay = c;

  const series = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, count]) => ({ day, count }));

  return {
    sampled,
    peakHour,
    peakDay,
    dayConcentration: sampled ? peakDay / sampled : 0,
    burst: peakHour > 0 ? { hour: `${burstHour}:00Z`, count: peakHour } : undefined,
    series,
  };
}
