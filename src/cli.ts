#!/usr/bin/env node
import { cac } from "cac";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { analyzeRepo } from "./analyze.js";
import { buildTrendingReport } from "./trending.js";
import { toJSON } from "./render/json.js";
import { toMarkdown } from "./render/markdown.js";

const VERSION = "0.1.0";

interface Flags {
  token?: string;
  pages?: number;
  sample?: number;
  top?: number;
  json?: boolean | string;
  md?: boolean | string;
  color?: boolean;
}

function fail(message: string): never {
  process.stderr.write(`\nfake-star-detector: ${message}\n\n`);
  process.exit(2);
}

function token(flags: Flags): string | undefined {
  return flags.token ?? process.env["GITHUB_TOKEN"] ?? process.env["GH_TOKEN"] ?? undefined;
}

async function run(target: string | undefined, flags: Flags): Promise<void> {
  if (!target) fail('Give a repo (or "trending"):\n  fake-star-detector facebook/react\n  fake-star-detector trending');
  if (flags.color === false) process.env["NO_COLOR"] = "1";
  const tok = token(flags);

  if (target === "trending") {
    let report;
    try {
      report = await buildTrendingReport({
        token: tok,
        pages: flags.pages ?? 6,
        sample: flags.sample ?? 20,
        onProgress: (repo, i, n) => process.stderr.write(`\r  analyzing ${i}/${n} … ${repo.padEnd(40).slice(0, 40)}`),
      });
      process.stderr.write("\r" + " ".repeat(64) + "\r");
    } catch (e) {
      fail((e as Error).message);
    }
    if (flags.json !== undefined) return void process.stdout.write(toJSON(report) + "\n");
    const { renderTrending } = await import("./render/console.js");
    return void process.stdout.write(renderTrending(report));
  }

  let analysis;
  try {
    analysis = await analyzeRepo(target, { token: tok, pages: flags.pages ?? 10, sample: flags.sample ?? 30 });
  } catch (e) {
    fail((e as Error).message);
  }

  if (flags.json !== undefined) {
    const out = toJSON(analysis);
    if (typeof flags.json === "string") writeFileSync(resolve(flags.json), out + "\n", "utf8");
    else process.stdout.write(out + "\n");
  } else if (flags.md !== undefined) {
    const out = toMarkdown(analysis);
    if (typeof flags.md === "string") writeFileSync(resolve(flags.md), out, "utf8");
    else process.stdout.write(out);
  } else {
    const { renderRepo } = await import("./render/console.js");
    process.stdout.write(renderRepo(analysis));
  }
}

const cli = cac("fake-star-detector");

cli
  .command("[target]", 'A repo (owner/name) to analyze, or "trending" for the leaderboard')
  .option("--token <tok>", "GitHub token (raises the rate limit; also GITHUB_TOKEN / GH_TOKEN env)")
  .option("--pages <n>", "Stargazer pages (×100 recent stars) to pull", { default: 10 })
  .option("--sample <n>", "How many recent stargazer accounts to sample", { default: 30 })
  .option("--top <n>", "Trending: how many repos", { default: 25 })
  .option("--json [file]", "JSON output")
  .option("--md [file]", "Markdown output")
  .option("--no-color", "Disable colors")
  .action((target: string | undefined, flags: Flags) => run(target, flags));

cli.help();
cli.version(VERSION);

try {
  cli.parse();
} catch (err) {
  fail((err as Error).message);
}
