# Contributing to fake-star-detector

Thanks for your interest! The most welcome contribution is a **sharper signal** —
a better way to tell a bot account from a real one, or score tuning that separates
bought stars from a genuine viral spike.

## Getting started

```bash
git clone https://github.com/didrod205/fake-star-detector.git
cd fake-star-detector
npm install
npm test            # vitest
npm run typecheck
npm run build       # tsup → dist/
GITHUB_TOKEN=$(gh auth token) npm run example   # analyze a real repo
npm run dev         # the site at localhost:5173
```

A token (`gh auth token`) is strongly recommended for live runs — unauthenticated
GitHub is ~60 requests/hour.

## Project layout

```
src/
  github.ts     # GitHub REST client — recent stargazers + account metadata (browser-safe, token-aware)
  spikes.ts     # pure: star timestamps → per-hour/day buckets + biggest burst
  accounts.ts   # pure: classify a sampled stargazer as bot-shaped (age-at-star, 0 followers/repos)
  score.ts      # pure: fake-o-meter (account-dominant) + bands
  analyze.ts    # crawl recent stars + sample accounts → RepoAnalysis
  trending.ts   # crawl github.com/trending → analyze each → ranked report
  render/       # console / markdown / json
  cli.ts        # cac CLI (a repo, or "trending")
  build-data.ts # node: trending → web/public/data/trending.json (run by the cron)
web/            # the site (reuses src/ to analyze repos live in the browser)
.github/workflows/crawl.yml   # re-analyzes trending every few hours and commits
tests/          # spikes/accounts/score + a full stubbed analyzeRepo
```

## Improving the signal

- **A better bot heuristic** → `classifyAccount` in `src/accounts.ts`. Keep
  precision high: a real user with no bio and few repos must *not* be flagged.
  The current gate is "empty account" (0 followers **and** 0 repos) or
  "brand-new + no followers." Add signals, but justify them with a test.
- **Score tuning** → `scoreRepo` in `src/score.ts`. The account share dominates on
  purpose; timing corroborates. The bar for `astroturfed` should stay high enough
  that a genuine viral repo doesn't trip it.

Add a test in `tests/core.test.ts`; keep calibration green (the stubbed botted
repo stays `astroturfed`; a real-account repo stays `organic`).

## The one rule

This points at **repos, never people.** It samples public account metadata to
score a *repo*; don't build anything that shames, ranks, or publishes lists of
individual users. And keep every claim a **heuristic with receipts**, never an
accusation.

## Quality bar

- [ ] `npm run typecheck && npm test && npm run build` pass.
- [ ] The core imports no `node:*` — keep it browser-safe (the site runs it live).
