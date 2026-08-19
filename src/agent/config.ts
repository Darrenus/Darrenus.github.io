/* Where the model comes from.
 *
 * Two backends, in priority order:
 *
 *   1. The proxy — an edge function that holds the DeepSeek key. Its URL is baked in at
 *      build time and is public by design; the key it holds is not. This is the path
 *      every visitor takes.
 *   2. A key the visitor pasted, kept in localStorage. For local development, and as an
 *      escape hatch if the proxy's daily budget is spent. Never shipped, never logged.
 *
 * With neither, the app falls back to the offline transport rather than showing an error,
 * so a fresh clone still runs.
 */

import { PROFILE } from "../profile";

const RAW_PROXY = import.meta.env.VITE_AGENT_PROXY_URL ?? "";

export const PROXY_URL = RAW_PROXY.replace(/\/+$/, "");

const KEY_STORAGE = "rong-agent.key";

export function byokKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null; // private mode, or storage disabled
  }
}

export function setByokKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

/** True when a model can actually be reached. */
export function hasModel(): boolean {
  return Boolean(PROXY_URL || byokKey());
}

/** True when the proxy is unavailable and we are calling DeepSeek directly. */
export function isDirect(): boolean {
  return !PROXY_URL && Boolean(byokKey());
}

export const DEEPSEEK_DIRECT_URL = "https://api.deepseek.com/chat/completions";

export const MODELS = {
  /** Main loop. Thinking on. Cheap enough to leave running. */
  main: "deepseek-v4-flash",
  /** Sub-agents and the follow-up generator: read, summarise, return. */
  fast: "deepseek-v4-flash",
} as const;

/** Repositories that must not be exposed through live GitHub tools. */
export const DENY_REPOS = new Set<string>();

export const GITHUB_USER = PROFILE.github.username;

/* These calls go straight from the browser to api.github.com rather than through the
 * proxy, and that is deliberate: unauthenticated GitHub allows 60 requests an hour per IP,
 * so each visitor spends their own budget. Routed through the proxy, every visitor would
 * share one 60/hour bucket and the first curious reader each hour would exhaust it. */
export const GITHUB_ACCOUNTS = PROFILE.github.accounts;

export const LIMITS = {
  /** Tool-calling rounds in the main loop before we stop and answer with what we have. */
  maxIterations: 8,
  /** Rounds inside a sub-agent. Deliberately small — a sub-agent reads, it does not plan. */
  maxSubagentIterations: 4,
  /** Concurrent sub-agents per turn. */
  maxSubagents: 3,
  /* Reasoning and answer share this budget on DeepSeek. 2000 was set before the prompt asked
   * the model to choose a diagram shape, and that choice turned out to be worth a great deal
   * of deliberation: on a broad question it spent the whole 2000 thinking, including drafting
   * the answer inside its own reasoning, and emitted no answer at all. Flash output is
   * $0.28/1M, so 6000 tokens is about a sixth of a cent per answer. */
  maxTokens: 6000,
  /* The tools-withheld retry runs with thinking off, so all of this goes to the answer. */
  retryMaxTokens: 3000,
  subagentMaxTokens: 900,
  /** Turns of prior conversation replayed to the model. */
  historyTurns: 8,
  /** Characters of a single tool result handed back to the model. */
  toolResultChars: 6000,
} as const;
