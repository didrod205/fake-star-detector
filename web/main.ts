import { analyzeRepo, BAND_EMOJI } from "../src/index.js";
import type { RepoAnalysis, TrendingReport } from "../src/index.js";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>("check");
const repoInput = $<HTMLInputElement>("repo");
const tokenInput = $<HTMLInputElement>("token");
const goBtn = $<HTMLButtonElement>("go");
const statusEl = $<HTMLElement>("status");
const resultEl = $<HTMLElement>("result");
const boardEl = $<HTMLElement>("board");
const boardMeta = $<HTMLElement>("board-meta");

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderResult(a: RepoAnalysis): void {
  const v = a.verdict;
  const burst = a.spikes.burst
    ? `<div class="receipt"><h4>Timing</h4>biggest burst: <span class="big">${a.spikes.burst.count}</span> stars in one hour · <span class="dim">${esc(a.spikes.burst.hour)}</span><br><span class="dim">${Math.round(a.spikes.dayConcentration * 100)}% of ${a.spikes.sampled} recent stars on a single day</span></div>`
    : "";
  const sus = a.samples.filter((s) => s.suspicious).slice(0, 6);
  const accts =
    a.sampleSize > 0
      ? `<div class="receipt"><h4>Accounts</h4><span class="big">${a.suspicious}</span>/${a.sampleSize} sampled recent stargazers look bot-shaped (${Math.round(a.suspiciousFraction * 100)}%)
         ${sus.length ? `<ul class="accts">${sus.map((s) => `<li><a href="https://github.com/${esc(s.login)}" target="_blank" rel="noopener">@${esc(s.login)}</a> — ${esc(s.reasons.slice(0, 3).join(", "))}</li>`).join("")}</ul>` : ""}</div>`
      : "";
  resultEl.innerHTML = `<div class="card band-${v.band}">
    <div class="repo"><a href="https://github.com/${esc(a.repo)}" target="_blank" rel="noopener">${esc(a.repo)}</a> <span class="dim">· ${a.stars.toLocaleString()} stars</span></div>
    <div class="score-row"><span class="score">${v.score}</span><span class="gauge"><span style="width:${v.score}%"></span></span><span class="label">${esc(v.label)} ${BAND_EMOJI[v.band]}</span></div>
    ${burst}${accts}
    <p class="dim" style="margin-top:.7rem">Heuristic, not proof — fast bursts of stars from empty, brand-new accounts ≈ purchased. Public data only.</p>
  </div>`;
}

function renderBoard(r: TrendingReport): void {
  boardMeta.textContent = `${r.count} repos · updated ${new Date(r.generatedAt).toLocaleString()} · heuristic, public data only`;
  boardEl.innerHTML = r.entries
    .map((e, i) => {
      const bits: string[] = [];
      if (e.suspiciousFraction > 0) bits.push(`${Math.round(e.suspiciousFraction * 100)}% bot-shaped`);
      if (e.burst) bits.push(`${e.burst.count}/hr burst`);
      return `<div class="row band-${e.band}">
        <span class="n">${i + 1}</span><span class="sc">${e.score}</span><span>${BAND_EMOJI[e.band]}</span>
        <a class="nm" href="https://github.com/${esc(e.repo)}" target="_blank" rel="noopener">${esc(e.repo)}</a>
        <span class="meta">${e.stars.toLocaleString()}★${bits.length ? " · " + bits.join(" · ") : ""}</span>
      </div>`;
    })
    .join("");
}

async function check(): Promise<void> {
  const repo = repoInput.value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
  if (!/^[^/]+\/[^/]+$/.test(repo)) {
    statusEl.textContent = "enter a repo as owner/name";
    return;
  }
  goBtn.disabled = true;
  statusEl.textContent = `crawling ${repo}'s recent stargazers…`;
  resultEl.innerHTML = "";
  try {
    const token = tokenInput.value.trim() || undefined;
    const a = await analyzeRepo(repo, { token, pages: 8, sample: 25 });
    statusEl.textContent = "";
    renderResult(a);
  } catch (e) {
    statusEl.textContent = (e as Error).message;
  } finally {
    goBtn.disabled = false;
  }
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  void check();
});

(async () => {
  try {
    const res = await fetch("./data/trending.json", { cache: "no-cache" });
    if (res.ok) renderBoard((await res.json()) as TrendingReport);
    else boardMeta.textContent = "leaderboard not built yet — check a repo above.";
  } catch {
    boardMeta.textContent = "leaderboard not built yet — check a repo above.";
  }
})();
