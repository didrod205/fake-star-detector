# fake-star-detector ⭐

**Is this GitHub repo's hype real?** Crawls a repo's recent stargazers and flags purchased/bot stars — from the **timing spikes** (hundreds in an hour) and the **empty accounts** behind them (days old, zero followers, zero repos, starred one thing and vanished). A fake-o-meter 0–100, with the receipts. No API key needed; a token just raises the rate limit.

### 🌐 [**Check any repo + today's trending leaderboard →**](https://didrod205.github.io/fake-star-detector/)

Paste a repo and it analyzes the stars live in your browser. Same engine in your terminal:

```bash
npx fake-star-detector facebook/react
npx fake-star-detector trending     # rank today's trending by how bought they look
```

```
  some-trending-org/rocket-launch · 48,201 stars

  82/100 ████████████████░░░░ Reeks of bought stars 🤖

  timing (of 1,000 recent stars)
    biggest burst: 412 stars in one hour · 2026-06-12T03:00Z
    91% of them landed on a single day  ▁▁▁▁▁█▁▁

  accounts (sampled 30 recent stargazers)
    26/30 look bot-shaped (87%)
      @xk29fja — account 2d old when it starred, 0 followers, 0 public repos, no bio
      @qz81mn0 — account 1d old when it starred, 0 followers, 0 public repos, no bio
      …

  heuristic, not proof — fast bursts + empty accounts ≈ purchased stars. public data only.
```

## Why

GitHub stars are a currency — and currencies get counterfeited. You can buy a
thousand stars for pocket change, and a lot of repos do, especially the ones
racing up *trending*. The fakes leave two fingerprints this tool reads:

1. **Timing.** Real stars trickle in; bought stars arrive in a wall — hundreds in
   an hour, the whole batch in a day.
2. **The accounts.** A real stargazer has a history. A bought one is a shell:
   created days ago, zero followers, zero repos, one star, gone.

`fake-star-detector` samples the **recent** stargazers (where the dumps show up),
measures both, and gives you a score and the receipts.

## How it works

```
GitHub stargazers API (starred_at)  ─crawl recent→  timing spikes  ─┐
GitHub users API (account metadata) ─sample→  empty-account share  ─┴→  fake-o-meter
```

- **Browser-safe** — `api.github.com` allows CORS, so the exact same crawler runs
  in the CLI, in CI, and live in the web page (no `node:*` in the core).
- **Account signal dominates** the score (empty accounts are the real tell); the
  timing concentration and single-hour burst corroborate. Among *trending* repos a
  big burst is expected, so we don't cry wolf on timing alone.
- The **live leaderboard** is static: a GitHub Action re-analyzes trending every
  few hours and commits the result — no server.

## Install & usage

```bash
npm i -g fake-star-detector     # then:  fake-star-detector owner/repo
# or zero-install:
npx fake-star-detector owner/repo
```

```bash
fake-star-detector facebook/react           # analyze one repo
fake-star-detector trending                 # rank today's trending by suspicion
fake-star-detector owner/repo --sample 50    # sample more accounts (more confident)
fake-star-detector owner/repo --md           # a Markdown report
fake-star-detector owner/repo --json         # the full analysis
```

`fakestars` is a shorter alias.

| Flag | |
| --- | --- |
| `--token <tok>` | a GitHub token (also `GITHUB_TOKEN` / `GH_TOKEN`) — raises 60 → 5,000 req/hr |
| `--pages <n>` | stargazer pages (×100 most-recent stars) to pull (default 10) |
| `--sample <n>` | recent stargazer accounts to sample (default 30) |
| `--json [file]` / `--md [file]` | machine-readable / Markdown output |

> **Rate limits:** unauthenticated GitHub allows ~60 requests/hour — enough for a
> check or two. A read-only token (or `gh auth token`) raises it to 5,000.

## Library

The core is pure and browser-safe:

```ts
import { analyzeRepo } from "fake-star-detector";

const a = await analyzeRepo("owner/repo", { token, sample: 40 });
a.verdict;             // { score: 82, band: "astroturfed", label: "Reeks of bought stars" }
a.suspiciousFraction;  // 0.87
a.spikes.burst;        // { hour: "2026-06-12T03:00Z", count: 412 }
a.samples;             // the sampled accounts, each with `suspicious` + `reasons`
```

## Honesty

This is a **heuristic, not proof.** A high score means a burst of recent stars
from empty, brand-new accounts — *the shape of* purchased stars. It is not a
certainty, and a fast-growing legit project can have a spiky day. It reads only
**public** data (stargazer timestamps and public account metadata), points at
**repos** rather than people, and shows you the receipts so you can judge for
yourself. Nothing about *you* is ever sent anywhere — in the browser, your
optional token goes straight to `api.github.com` and stays in the tab.

## Contributing

The most useful contribution is a **sharper account heuristic** or score tuning.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © [didrod205](https://github.com/didrod205)

---

<sub>Stars are a currency. This is the counterfeit detector. Heuristic, public data, judge for yourself.</sub>

## 💖 Sponsor

Find this useful? [**Sponsor on GitHub**](https://github.com/sponsors/didrod205) — it keeps these projects maintained.

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-db61a2?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/didrod205)
