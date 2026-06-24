import type { StarEvent } from "./types.js";

// Browser-safe GitHub REST client: global fetch only, optional bearer token.
// api.github.com sends CORS headers, so this runs in the CLI, in CI, and live in
// the web page. Unauthenticated = 60 req/hr; a token raises it to 5,000.

const API = "https://api.github.com";
const UA = "fake-star-detector (+https://github.com/didrod205/fake-star-detector)";

export interface GhOptions {
  token?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

async function ghJson<T>(path: string, opts: GhOptions & { accept?: string } = {}): Promise<T> {
  const f = opts.fetchImpl ?? fetch;
  const headers: Record<string, string> = {
    Accept: opts.accept ?? "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": UA,
  };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await f(`${API}${path}`, { headers, signal: opts.signal });
  if (!res.ok) {
    if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
      throw new Error("GitHub rate limit hit — add a token (GITHUB_TOKEN env, --token, or paste one in the box).");
    }
    if (res.status === 404) throw new Error("repo not found (or private).");
    const t = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status}: ${t.slice(0, 140)}`);
  }
  return (await res.json()) as T;
}

export interface RepoMeta {
  stars: number;
  createdAt?: string;
  language?: string;
  description?: string;
}

export async function getRepo(owner: string, repo: string, opts: GhOptions = {}): Promise<RepoMeta> {
  const d = await ghJson<{ stargazers_count?: number; created_at?: string; language?: string | null; description?: string | null }>(`/repos/${owner}/${repo}`, opts);
  return { stars: d.stargazers_count ?? 0, createdAt: d.created_at, language: d.language ?? undefined, description: d.description ?? undefined };
}

interface StargazerRow {
  starred_at?: string;
  user?: { login?: string };
}

/**
 * Pull the **most recent** stars (where bot dumps show up). Stargazers come
 * oldest-first, so we jump to the last pages and walk backward.
 */
export async function crawlRecentStars(
  owner: string,
  repo: string,
  opts: GhOptions & { pages?: number } = {},
): Promise<{ stars: number; createdAt?: string; language?: string; description?: string; events: StarEvent[] }> {
  const meta = await getRepo(owner, repo, opts);
  const per = 100;
  const want = Math.max(1, opts.pages ?? 10);
  const lastPage = Math.min(400, Math.max(1, Math.ceil(meta.stars / per))); // GitHub caps stargazers at 40k
  const start = Math.max(1, lastPage - want + 1);
  const events: StarEvent[] = [];
  for (let p = start; p <= lastPage; p++) {
    const rows = await ghJson<StargazerRow[]>(`/repos/${owner}/${repo}/stargazers?per_page=${per}&page=${p}`, {
      ...opts,
      accept: "application/vnd.github.star+json",
    });
    for (const r of rows) {
      if (r.user?.login && r.starred_at) events.push({ login: r.user.login, starredAt: r.starred_at });
    }
  }
  events.sort((a, b) => Date.parse(a.starredAt) - Date.parse(b.starredAt));
  return { stars: meta.stars, createdAt: meta.createdAt, language: meta.language, description: meta.description, events };
}

export interface AccountMeta {
  login: string;
  createdAt: string;
  followers: number;
  publicRepos: number;
  bio?: string;
}

export async function getAccount(login: string, opts: GhOptions = {}): Promise<AccountMeta | null> {
  try {
    const d = await ghJson<{ created_at?: string; followers?: number; public_repos?: number; bio?: string | null }>(`/users/${login}`, opts);
    return { login, createdAt: d.created_at ?? "", followers: d.followers ?? 0, publicRepos: d.public_repos ?? 0, bio: d.bio ?? undefined };
  } catch {
    return null;
  }
}

/** Scrape github.com/trending → ["owner/repo", …]. Node/CI only (no CORS in-browser). */
export async function crawlTrending(opts: GhOptions = {}): Promise<string[]> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f("https://github.com/trending", { headers: { "User-Agent": UA }, signal: opts.signal });
  if (!res.ok) throw new Error(`github.com/trending responded ${res.status}`);
  const html = await res.text();
  const out: string[] = [];
  const re = /<h2\b[^>]*>[\s\S]*?<a[^>]*href="\/([^"/]+)\/([^"/?#]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(`${m[1]}/${m[2]}`);
  return [...new Set(out)].slice(0, 25);
}
