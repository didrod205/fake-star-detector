// Public, browser-safe API. No node:* imports here — the web page analyzes repos
// live with this exact core (api.github.com supports CORS).
export { analyzeRepo } from "./analyze.js";
export type { AnalyzeOptions } from "./analyze.js";
export { getRepo, crawlRecentStars, getAccount, crawlTrending } from "./github.js";
export type { GhOptions, RepoMeta, AccountMeta } from "./github.js";
export { computeSpikes } from "./spikes.js";
export { classifyAccount, summarize } from "./accounts.js";
export type { AccountInput } from "./accounts.js";
export { scoreRepo } from "./score.js";
export type { ScoreInput } from "./score.js";
export { BAND_EMOJI, BAND_LABEL } from "./types.js";
export type {
  Account,
  Band,
  RepoAnalysis,
  SpikeStats,
  StarEvent,
  TrendingEntry,
  TrendingReport,
  Verdict,
} from "./types.js";
