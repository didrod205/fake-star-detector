import type { Band, Verdict } from "./types.js";
import { BAND_LABEL } from "./types.js";

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export interface ScoreInput {
  /** share of sampled stargazers that look bot-shaped (0–1). */
  suspiciousFraction: number;
  /** how many accounts we actually sampled. */
  sampleSize: number;
  /** share of sampled stars on the single busiest day (0–1). */
  dayConcentration: number;
  /** most stars in any single hour. */
  peakHour: number;
  /** total stars sampled. */
  sampled: number;
}

/**
 * The fake-o-meter. The account signal dominates (empty accounts are the real
 * tell); the timing concentration and the single-hour burst corroborate. We only
 * commit to a verdict with enough data — virality and botting both spike, so
 * without account samples we stay cautious.
 */
export function scoreRepo(s: ScoreInput): Verdict {
  if (s.sampleSize < 8 && s.sampled < 25) {
    return { score: 0, band: "inconclusive", label: BAND_LABEL.inconclusive };
  }

  const acct = s.sampleSize >= 8 ? clamp01(s.suspiciousFraction) : 0;
  const conc = clamp01((s.dayConcentration - 0.3) / 0.7); // concentration past ~30% ramps up
  const burst = clamp01(s.peakHour / Math.max(25, s.sampled * 0.5)); // a wall of stars in one hour

  // Among trending repos a big burst is expected (they're trending!), so the
  // empty-account share is the real discriminator and carries the most weight.
  let raw = 0.75 * acct + 0.15 * conc + 0.1 * burst;
  // Without account data, timing alone can't tell virality from bots — cap it.
  if (s.sampleSize < 8) raw = Math.min(raw, 0.44);
  const score = Math.round(clamp01(raw) * 100);

  const band: Band = score >= 70 ? "astroturfed" : score >= 45 ? "suspicious" : score >= 20 ? "odd" : "organic";
  return { score, band, label: BAND_LABEL[band] };
}
