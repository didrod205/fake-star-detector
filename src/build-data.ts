// Node entry run by the GitHub Actions cron (and locally to seed). Crawls today's
// trending repos, analyzes each, and writes the leaderboard the static site reads.
// Output lives in web/public/data so Vite copies it into the Pages build.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildTrendingReport } from "./trending.js";

async function main(): Promise<void> {
  const token = process.env["GITHUB_TOKEN"] ?? process.env["GH_TOKEN"];
  const out = resolve(process.cwd(), "web/public/data/trending.json");

  process.stdout.write(`fake-star-detector: analyzing today's GitHub trending…${token ? "" : " (no token — limited rate)"}\n`);
  // Kept light so the Actions GITHUB_TOKEN (~1k req/hr/repo) is never exceeded:
  // ~25 repos × (5 star pages + 15 account samples + 1) ≈ 525 calls.
  const report = await buildTrendingReport({
    token,
    pages: 5,
    sample: 15,
    onProgress: (repo, i, n) => process.stdout.write(`  ${i}/${n} ${repo}\n`),
  });

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report) + "\n", "utf8");
  process.stdout.write(`fake-star-detector: ${report.count} repos ranked → ${out}\n`);
}

main().catch((e) => {
  process.stderr.write(`fake-star-detector build-data failed: ${(e as Error).message}\n`);
  process.exit(1);
});
