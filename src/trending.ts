import { crawlTrending, type GhOptions } from "./github.js";
import { analyzeRepo } from "./analyze.js";
import type { TrendingEntry, TrendingReport } from "./types.js";

export interface TrendingOptions extends GhOptions {
  /** analyze these repos instead of scraping github.com/trending. */
  repos?: string[];
  pages?: number;
  sample?: number;
  now?: number;
  onProgress?: (repo: string, i: number, n: number) => void;
}

/** Crawl trending → analyze each → ranked report (most-suspicious first). */
export async function buildTrendingReport(opts: TrendingOptions = {}): Promise<TrendingReport> {
  const repos = opts.repos ?? (await crawlTrending(opts));
  const entries: TrendingEntry[] = [];
  let i = 0;
  for (const repo of repos) {
    i += 1;
    opts.onProgress?.(repo, i, repos.length);
    try {
      const a = await analyzeRepo(repo, { ...opts, pages: opts.pages ?? 6, sample: opts.sample ?? 20 });
      entries.push({
        repo: a.repo,
        stars: a.stars,
        language: a.language,
        description: a.description,
        score: a.verdict.score,
        band: a.verdict.band,
        label: a.verdict.label,
        suspiciousFraction: a.suspiciousFraction,
        peakDay: a.spikes.peakDay,
        burst: a.spikes.burst,
      });
    } catch {
      // skip repos we can't read (rate limit on a single one, private, gone)
    }
  }
  entries.sort((a, b) => b.score - a.score || b.suspiciousFraction - a.suspiciousFraction);
  return { generatedAt: new Date(opts.now ?? Date.now()).toISOString(), count: entries.length, entries };
}
