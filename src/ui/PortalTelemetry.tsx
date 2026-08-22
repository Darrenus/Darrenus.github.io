import { useEffect, useState } from "react";
import { hasModel, LIMITS } from "../agent/config";
import "./portal.css";

interface GitHubCommit {
  sha: string;
  html_url: string;
  commit?: {
    message?: string;
    author?: { date?: string };
    committer?: { date?: string };
  };
}

interface CachedCommit {
  fetchedAt: number;
  commit: GitHubCommit;
}

const CACHE_KEY = "rong.portal.latest-commit";
const CACHE_TTL = 5 * 60 * 1000;

function readCache(repository: string): GitHubCommit | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(`${CACHE_KEY}:${repository}`) ?? "") as CachedCommit;
    if (Date.now() - cached.fetchedAt < CACHE_TTL) return cached.commit;
  } catch {
    /* A blocked or malformed session cache should not affect the HUD. */
  }
  return null;
}

function writeCache(repository: string, commit: GitHubCommit): void {
  try {
    sessionStorage.setItem(`${CACHE_KEY}:${repository}`, JSON.stringify({ fetchedAt: Date.now(), commit } satisfies CachedCommit));
  } catch {
    /* Ignore private browsing and quota failures. */
  }
}

function useLatestCommit(repository: string): { commit: GitHubCommit | null; failed: boolean; now: number } {
  const [commit, setCommit] = useState<GitHubCommit | null>(() => readCache(repository));
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const cached = readCache(repository);
    if (cached) {
      setCommit(cached);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    setFailed(false);
    fetch(`https://api.github.com/repos/${repository}/commits?per_page=1`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
        const payload = await response.json() as GitHubCommit[];
        const latest = payload[0];
        if (!latest) throw new Error("No commits returned");
        writeCache(repository, latest);
        setCommit(latest);
      })
      .catch(() => setFailed(true))
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [repository]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return { commit, failed, now };
}

function relativeTime(date: string | undefined, now: number): string {
  if (!date) return "UNKNOWN";
  const seconds = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function compactLimit(tokens: number): string {
  return tokens >= 1000 ? `${Math.round(tokens / 1000)}k` : String(tokens);
}

export default function PortalTelemetry({ repository }: { repository: string }) {
  const { commit, failed, now } = useLatestCommit(repository);
  const commitDate = commit?.commit?.committer?.date ?? commit?.commit?.author?.date;
  const commitAge = commit ? relativeTime(commitDate, now) : failed ? "UNAVAILABLE" : "SYNCING";

  return (
    <aside className="portal-hud" aria-label="RONG 实时状态">
      <div className="portal-hud-block portal-hud-block--top-left">
        <strong>NUS · SINGAPORE</strong>
        <span>1°17'N 103°51'E</span>
      </div>
      <div className="portal-hud-block portal-hud-block--top-right">
        <strong>KAIST · KOREA</strong>
        <span>36°22'N 127°22'E</span>
      </div>
      <div className="portal-hud-block portal-hud-block--bottom-left">
        <strong>LAST COMMIT <em>{commitAge}</em></strong>
        <span>github/{repository}</span>
      </div>
      <div className="portal-hud-block portal-hud-block--bottom-right">
        <strong>RAGENT {hasModel() ? "LIVE" : "READY"}</strong>
        <span>ctx {LIMITS.historyTurns} turns · {compactLimit(LIMITS.maxTokens)} max</span>
      </div>
    </aside>
  );
}
