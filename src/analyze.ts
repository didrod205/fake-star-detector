import { crawlRecentStars, getAccount, type GhOptions } from "./github.js";
import { computeSpikes } from "./spikes.js";
import { classifyAccount, summarize } from "./accounts.js";
import { scoreRepo } from "./score.js";
import type { Account, RepoAnalysis } from "./types.js";

export interface AnalyzeOptions extends GhOptions {
  /** stargazer pages (×100) to pull from the most recent. */
  pages?: number;
  /** how many recent stargazer accounts to sample. */
  sample?: number;
  now?: number;
}

function pickEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr.slice();
  const out: T[] = [];
  const step = arr.length / n;
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]!);
  return out;
}

/** Crawl a repo's recent stars + sample the accounts behind them → a verdict. */
export async function analyzeRepo(full: string, opts: AnalyzeOptions = {}): Promise<RepoAnalysis> {
  const slash = full.indexOf("/");
  if (slash < 1 || slash === full.length - 1) throw new Error(`give a repo as owner/name (got "${full}")`);
  const owner = full.slice(0, slash);
  const repo = full.slice(slash + 1);

  const { stars, createdAt, language, description, events } = await crawlRecentStars(owner, repo, { ...opts, pages: opts.pages ?? 10 });
  const spikes = computeSpikes(events);

  const sampleN = Math.min(opts.sample ?? 30, events.length);
  const recent = events.slice(-Math.min(events.length, sampleN * 4)); // bot dumps live in the most recent stars
  const picks = pickEvenly(recent, sampleN);
  const samples: Account[] = [];
  for (const e of picks) {
    const a = await getAccount(e.login, opts);
    if (!a || !a.createdAt) continue;
    const cls = classifyAccount({ ...a, starredAt: e.starredAt });
    samples.push({
      login: a.login,
      createdAt: a.createdAt,
      followers: a.followers,
      publicRepos: a.publicRepos,
      bio: a.bio,
      starredAt: e.starredAt,
      suspicious: cls.suspicious,
      reasons: cls.reasons,
    });
  }

  const sum = summarize(samples);
  const verdict = scoreRepo({
    suspiciousFraction: sum.fraction,
    sampleSize: sum.sampleSize,
    dayConcentration: spikes.dayConcentration,
    peakHour: spikes.peakHour,
    sampled: spikes.sampled,
  });

  return {
    repo: full,
    stars,
    createdAt,
    language,
    description,
    spikes,
    sampleSize: sum.sampleSize,
    suspicious: sum.suspicious,
    suspiciousFraction: sum.fraction,
    samples,
    verdict,
    analyzedAt: new Date(opts.now ?? Date.now()).toISOString(),
  };
}
