import type { RepoAnalysis, TrendingReport } from "../types.js";

export function toJSON(data: RepoAnalysis | TrendingReport): string {
  return JSON.stringify(data, null, 2);
}
