// Pure, browser-safe data model — powers the CLI, the cron, and the web check.

/** One star, as the GitHub stargazers API gives it with the star+json media type. */
export interface StarEvent {
  login: string;
  starredAt: string; // ISO
}

/** A sampled stargazer's account, enriched from /users/{login}. */
export interface Account {
  login: string;
  createdAt: string; // ISO
  followers: number;
  publicRepos: number;
  starredAt: string; // ISO — when they starred the repo in question
  bio?: string;
  suspicious: boolean;
  reasons: string[];
}

export interface SpikeStats {
  /** stars in the sample. */
  sampled: number;
  /** most stars in any single UTC hour. */
  peakHour: number;
  /** most stars in any single UTC day. */
  peakDay: number;
  /** share of sampled stars that landed on the single busiest day (0–1). */
  dayConcentration: number;
  /** the busiest hour's timestamp + count (the smoking gun). */
  burst?: { hour: string; count: number };
  /** small per-day series for a sparkline (most recent buckets). */
  series: { day: string; count: number }[];
}

export type Band = "organic" | "odd" | "suspicious" | "astroturfed" | "inconclusive";

export interface Verdict {
  /** 0–100; higher = more likely the stars were bought. */
  score: number;
  band: Band;
  label: string;
}

export interface RepoAnalysis {
  repo: string; // owner/name
  stars: number;
  createdAt?: string;
  language?: string;
  description?: string;
  spikes: SpikeStats;
  /** suspicious accounts / sampled accounts. */
  sampleSize: number;
  suspicious: number;
  suspiciousFraction: number;
  samples: Account[];
  verdict: Verdict;
  analyzedAt: string;
}

export interface TrendingEntry {
  repo: string;
  stars: number;
  language?: string;
  description?: string;
  score: number;
  band: Band;
  label: string;
  suspiciousFraction: number;
  peakDay: number;
  burst?: { hour: string; count: number };
}

export interface TrendingReport {
  generatedAt: string;
  count: number;
  entries: TrendingEntry[];
}

export const BAND_EMOJI: Record<Band, string> = {
  organic: "🌱",
  odd: "🤔",
  suspicious: "🚩",
  astroturfed: "🤖",
  inconclusive: "❔",
};

export const BAND_LABEL: Record<Band, string> = {
  organic: "Looks organic",
  odd: "A few oddities",
  suspicious: "Suspicious",
  astroturfed: "Reeks of bought stars",
  inconclusive: "Not enough data",
};
