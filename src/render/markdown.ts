import type { RepoAnalysis } from "../types.js";
import { BAND_EMOJI } from "../types.js";

export function toMarkdown(a: RepoAnalysis): string {
  const L: string[] = [];
  L.push(`# ⭐ fake-star-detector — ${a.repo}`);
  L.push("");
  L.push(`> **${a.verdict.score}/100 · ${a.verdict.label} ${BAND_EMOJI[a.verdict.band]}** · ${a.stars.toLocaleString()} stars`);
  L.push("");
  if (a.spikes.burst) {
    L.push(`- **Biggest burst:** ${a.spikes.burst.count} stars in one hour (${a.spikes.burst.hour})`);
    L.push(`- **Day concentration:** ${Math.round(a.spikes.dayConcentration * 100)}% of ${a.spikes.sampled} recent stars on one day`);
  }
  if (a.sampleSize > 0) {
    L.push(`- **Accounts:** ${a.suspicious}/${a.sampleSize} sampled recent stargazers look bot-shaped (${Math.round(a.suspiciousFraction * 100)}%)`);
    const sus = a.samples.filter((s) => s.suspicious).slice(0, 6);
    if (sus.length) {
      L.push("");
      L.push("| Account | Why |");
      L.push("| --- | --- |");
      for (const s of sus) L.push(`| \`@${s.login}\` | ${s.reasons.join(", ")} |`);
    }
  }
  L.push("");
  L.push("---");
  L.push("<sub>heuristic, not proof — by [fake-star-detector](https://github.com/didrod205/fake-star-detector). Public data only.</sub>");
  return L.join("\n") + "\n";
}
