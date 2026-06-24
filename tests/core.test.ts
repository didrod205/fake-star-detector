import { describe, it, expect } from "vitest";
import { computeSpikes } from "../src/spikes.js";
import { classifyAccount, summarize } from "../src/accounts.js";
import { scoreRepo } from "../src/score.js";
import { analyzeRepo } from "../src/analyze.js";
import type { StarEvent } from "../src/types.js";

describe("computeSpikes", () => {
  it("finds the busiest hour and day concentration", () => {
    const events: StarEvent[] = [
      ...Array.from({ length: 50 }, (_, i) => ({ login: `a${i}`, starredAt: `2026-06-12T03:${String(i % 60).padStart(2, "0")}:00Z` })),
      { login: "z1", starredAt: "2026-06-10T10:00:00Z" },
      { login: "z2", starredAt: "2026-06-11T10:00:00Z" },
    ];
    const s = computeSpikes(events);
    expect(s.sampled).toBe(52);
    expect(s.peakHour).toBe(50);
    expect(s.peakDay).toBe(50);
    expect(s.burst?.hour).toBe("2026-06-12T03:00Z");
    expect(s.dayConcentration).toBeCloseTo(50 / 52, 2);
  });
});

describe("classifyAccount", () => {
  it("flags an empty, brand-new account", () => {
    const r = classifyAccount({ login: "bot", createdAt: "2026-06-11T00:00:00Z", followers: 0, publicRepos: 0, starredAt: "2026-06-12T00:00:00Z" });
    expect(r.suspicious).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/0 followers/);
  });
  it("does not flag an established account", () => {
    const r = classifyAccount({ login: "real", createdAt: "2019-01-01T00:00:00Z", followers: 120, publicRepos: 30, bio: "dev", starredAt: "2026-06-12T00:00:00Z" });
    expect(r.suspicious).toBe(false);
  });
  it("summarize computes the suspicious fraction", () => {
    expect(summarize([{ suspicious: true }, { suspicious: true }, { suspicious: false }, { suspicious: false }]).fraction).toBe(0.5);
  });
});

describe("scoreRepo", () => {
  it("astroturfed when most sampled accounts are bot-shaped", () => {
    const v = scoreRepo({ suspiciousFraction: 0.9, sampleSize: 30, dayConcentration: 0.95, peakHour: 300, sampled: 300 });
    expect(v.band).toBe("astroturfed");
    expect(v.score).toBeGreaterThanOrEqual(70);
  });
  it("organic when accounts look real", () => {
    const v = scoreRepo({ suspiciousFraction: 0.05, sampleSize: 30, dayConcentration: 0.2, peakHour: 5, sampled: 300 });
    expect(v.band).toBe("organic");
  });
  it("inconclusive without enough data", () => {
    expect(scoreRepo({ suspiciousFraction: 0, sampleSize: 1, dayConcentration: 0, peakHour: 0, sampled: 2 }).band).toBe("inconclusive");
  });
  it("caps the band when timing-only (no account sample)", () => {
    const v = scoreRepo({ suspiciousFraction: 0, sampleSize: 0, dayConcentration: 1, peakHour: 300, sampled: 300 });
    expect(v.score).toBeLessThan(45); // can't call it astroturfed on timing alone
  });
});

function ok(body: unknown): Response {
  return { ok: true, status: 200, headers: { get: () => null }, json: async () => body, text: async () => "" } as unknown as Response;
}

/** A repo whose recent stars all landed in one hour from empty, day-old accounts. */
function bottedFetch(): typeof fetch {
  return (async (url: string) => {
    const u = String(url);
    if (u.includes("/stargazers")) {
      const page = Number(new URL(u).searchParams.get("page") ?? "1");
      const rows = Array.from({ length: 100 }, (_, i) => ({ user: { login: `bot_${page}_${i}` }, starred_at: `2026-06-12T03:${String(i % 60).padStart(2, "0")}:00Z` }));
      return ok(rows);
    }
    if (u.includes("/users/")) return ok({ created_at: "2026-06-11T12:00:00Z", followers: 0, public_repos: 0, bio: null });
    if (u.includes("/repos/")) return ok({ stargazers_count: 250, created_at: "2026-06-10T00:00:00Z", language: "TypeScript", description: "totally legit" });
    return { ok: false, status: 404, headers: { get: () => null }, text: async () => "nf" } as unknown as Response;
  }) as typeof fetch;
}

describe("analyzeRepo (end-to-end, stubbed)", () => {
  it("flags a botted repo as astroturfed with receipts", async () => {
    const a = await analyzeRepo("someone/suspicious", { fetchImpl: bottedFetch(), sample: 30, pages: 10, now: Date.parse("2026-06-12T05:00:00Z") });
    expect(a.stars).toBe(250);
    expect(a.verdict.band).toBe("astroturfed");
    expect(a.verdict.score).toBeGreaterThanOrEqual(70);
    expect(a.suspiciousFraction).toBe(1);
    expect(a.sampleSize).toBe(30);
    expect(a.spikes.burst?.count).toBeGreaterThan(100);
    expect(a.language).toBe("TypeScript");
  });

  it("rejects a malformed repo arg", async () => {
    await expect(analyzeRepo("noslash", { fetchImpl: bottedFetch() })).rejects.toThrow(/owner\/name/);
  });
});
