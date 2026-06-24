// Pure. The real tell of a bought star isn't the timing — it's the account
// behind it: created days ago, zero followers, zero repos, starred one thing and
// vanished. This classifies a sampled stargazer.

export interface AccountInput {
  login: string;
  createdAt: string;
  followers: number;
  publicRepos: number;
  bio?: string;
  starredAt: string;
}

export function classifyAccount(a: AccountInput): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const ageDays = (Date.parse(a.starredAt) - Date.parse(a.createdAt)) / 86_400_000;
  const fresh = Number.isFinite(ageDays) && ageDays < 30;
  if (fresh) reasons.push(`account ${Math.max(0, Math.round(ageDays))}d old when it starred`);
  if (a.followers === 0) reasons.push("0 followers");
  if (a.publicRepos === 0) reasons.push("0 public repos");
  if (!a.bio) reasons.push("no bio");

  // Empty account, or a brand-new account with no social footprint = bot-shaped.
  const empty = a.followers === 0 && a.publicRepos === 0;
  const newAndHollow = Number.isFinite(ageDays) && ageDays < 14 && a.followers === 0;
  return { suspicious: empty || newAndHollow, reasons };
}

export function summarize(accounts: { suspicious: boolean }[]): { sampleSize: number; suspicious: number; fraction: number } {
  const sampleSize = accounts.length;
  const suspicious = accounts.filter((a) => a.suspicious).length;
  return { sampleSize, suspicious, fraction: sampleSize ? suspicious / sampleSize : 0 };
}
