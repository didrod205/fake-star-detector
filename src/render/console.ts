import pc from "picocolors";
import type { Band, RepoAnalysis, TrendingReport } from "../types.js";
import { BAND_EMOJI } from "../types.js";

function paint(band: Band, s: string): string {
  if (band === "organic") return pc.green(s);
  if (band === "odd") return pc.cyan(s);
  if (band === "suspicious") return pc.yellow(s);
  if (band === "astroturfed") return pc.red(s);
  return pc.dim(s);
}

function gauge(score: number): string {
  const n = Math.round((score / 100) * 20);
  return "█".repeat(n) + pc.dim("░".repeat(20 - n));
}

const SPARK = "▁▂▃▄▅▆▇█";
function sparkline(series: { count: number }[]): string {
  if (series.length === 0) return "";
  const max = Math.max(...series.map((s) => s.count), 1);
  return series.slice(-30).map((s) => SPARK[Math.min(7, Math.floor((s.count / max) * 7))]).join("");
}

/** The fake-o-meter for one repo, with the receipts. */
export function renderRepo(a: RepoAnalysis): string {
  const L: string[] = [];
  const ind = "  ";
  L.push("");
  L.push(`${ind}${pc.bold(a.repo)} ${pc.dim(`· ${a.stars.toLocaleString()} stars`)}`);
  L.push("");
  L.push(`${ind}${paint(a.verdict.band, pc.bold(`${a.verdict.score}/100`))} ${gauge(a.verdict.score)} ${paint(a.verdict.band, pc.bold(a.verdict.label))} ${BAND_EMOJI[a.verdict.band]}`);
  L.push("");

  // timing receipts
  if (a.spikes.burst) {
    const concPct = Math.round(a.spikes.dayConcentration * 100);
    L.push(`${ind}${pc.bold("timing")} ${pc.dim(`(of ${a.spikes.sampled} recent stars)`)}`);
    L.push(`${ind}  biggest burst: ${pc.red(String(a.spikes.burst.count))} stars in one hour ${pc.dim("· " + a.spikes.burst.hour)}`);
    L.push(`${ind}  ${concPct}% of them landed on a single day  ${pc.dim(sparkline(a.spikes.series))}`);
    L.push("");
  }

  // account receipts
  if (a.sampleSize > 0) {
    const pct = Math.round(a.suspiciousFraction * 100);
    L.push(`${ind}${pc.bold("accounts")} ${pc.dim(`(sampled ${a.sampleSize} recent stargazers)`)}`);
    L.push(`${ind}  ${paint(pct >= 45 ? "suspicious" : "odd", String(a.suspicious))}/${a.sampleSize} look bot-shaped ${pc.dim(`(${pct}%)`)}`);
    for (const s of a.samples.filter((x) => x.suspicious).slice(0, 4)) {
      L.push(`${ind}    ${pc.red("@" + s.login)} ${pc.dim("— " + s.reasons.slice(0, 3).join(", "))}`);
    }
    L.push("");
  }

  L.push(`${ind}${pc.dim("heuristic, not proof — fast bursts + empty accounts ≈ purchased stars. public data only.")}`);
  L.push("");
  return L.join("\n");
}

/** A ranked leaderboard (trending repos by suspicion). */
export function renderTrending(r: TrendingReport): string {
  const L: string[] = [];
  const ind = "  ";
  L.push("");
  L.push(`${ind}${pc.bold("⭐ fake-star-detector")} ${pc.dim("— today's trending repos, ranked by how bought their stars look")}`);
  L.push("");
  r.entries.forEach((e, i) => {
    const rank = pc.dim(`${String(i + 1).padStart(2, " ")}.`);
    L.push(`${ind}${rank} ${paint(e.band, pc.bold(`${e.score}`.padStart(3)))} ${BAND_EMOJI[e.band]} ${pc.bold(e.repo)} ${pc.dim(`· ${e.stars.toLocaleString()}★`)}`);
    const bits: string[] = [];
    if (e.suspiciousFraction > 0) bits.push(`${Math.round(e.suspiciousFraction * 100)}% bot-shaped accounts`);
    if (e.burst) bits.push(`${e.burst.count} stars/hr burst`);
    if (bits.length) L.push(`${ind}    ${pc.dim(bits.join(" · "))}`);
  });
  L.push("");
  L.push(`${ind}${pc.dim(`${r.count} repos · heuristic, public data only · ${r.generatedAt.slice(0, 16).replace("T", " ")}`)}`);
  L.push("");
  return L.join("\n");
}
