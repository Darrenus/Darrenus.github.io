/* The RONG Agent interface.
 *
 * It renders the transport's event stream and owns no timing of its own. Swap the
 * transport and this file does not change — which is the whole point of the contract in
 * src/agent/events.ts.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { AgentEvent, Transport } from "../agent/events";
import { initialState, reducer, type AgentMessage, type Segment } from "./state";
import { Markdown } from "./markdown";
import { startFavicon } from "./favicon";
import SiteHeader from "./SiteHeader";
import { readQuestion } from "./observations";
import { sourceHref } from "./source-link";
import { isSoundMuted, playUiSound, setSoundMuted } from "./sound";
import { PROFILE } from "../profile";
import "./agent.css";

/* Four openers a visitor can ask on arrival, knowing nothing.
 *
 * The first set asked about transfer throughput going from 70 to 290 MB/s, what the
 * copy-as-decode paper proves, and how the wallet's consent gate is implemented. Every one of
 * those is a question you can only think of after you already know the answer exists. They
 * demonstrated the agent's range to someone who did not need the demonstration, and told a
 * recruiter opening the page cold that they were in the wrong place.
 *
 * These still cover four different capabilities — a summary, a chronology, current work, and
 * reading the live repositories — because a visitor learns more from what the openers imply is
 * answerable than from any description of the site. The difference is that each one is now a
 * question a stranger would actually have. */
const SEED_QUESTIONS = [
  "贺融是谁？",
  "介绍一下他的经历。",
  "他做过哪些 AI 项目？",
  "他如何设计 codeloop？",
];

/** Sources shown before the list is folded. */
const SOURCE_LIMIT = 12;

/* One sentence. The earlier version listed what the index holds and where the loop runs, which
 * is all true and none of it the reader's problem: a visitor can ask the agent either question.
 * What a footnote owes them is the caveat they cannot discover for themselves. */
const FOOTER_NOTE = "回答可能有误，来源均已链接。";

/* A build with no model configured answers from a handful of canned replies. Saying that
 * is better than a footnote promising retrieval and web search that cannot happen. */
const OFFLINE_NOTE = "当前未配置模型，显示的是离线预设回答。公开资料仍以来源为准。";

interface Props {
  wordmark?: string;
  showSuggestions?: boolean;
  showUsage?: boolean;
  footerNote?: string;
  /** False when no model is reachable, which changes what the footnote may claim. */
  live?: boolean;
  transport: Transport;
}

/* --------------------------------------------------------------------- composer */

function Composer({
  value,
  placeholder,
  rows,
  busy,
  dock,
  onChange,
  onSend,
  onStop,
}: {
  value: string;
  placeholder: string;
  rows: number;
  busy: boolean;
  dock?: boolean;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
}) {
  const ta = useRef<HTMLTextAreaElement | null>(null);

  // The design caps the textarea at a max-height, which only means something if the
  // field grows. Reset to auto first so deleting text shrinks it again.
  useEffect(() => {
    const node = ta.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  return (
    <div className={dock ? "composer composer--dock" : "composer"}>
      <textarea
        ref={ta}
        rows={rows}
        aria-label="你的问题"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      {busy ? (
        <button className="iconbtn" aria-label="停止回答" onClick={onStop}>
          <span className="stop-square" />
        </button>
      ) : (
        <button
          className="iconbtn"
          aria-label="发送"
          disabled={!value.trim()}
          onClick={onSend}
        >
          <svg
            width={dock ? 15 : 16}
            height={dock ? 15 : 16}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 13V3" />
            <path d="M3.5 7.5L8 3l4.5 4.5" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- activity */

function Activity({
  segment,
  running,
  status,
  onToggle,
}: {
  segment: Segment;
  running: boolean;
  status: string;
  onToggle: () => void;
}) {
  const segRunning = running && !segment.endedAt;
  const n = segment.items.length;
  const secs = ((segment.endedAt || Date.now()) - segment.startedAt) / 1000;
  const label = segRunning
    ? status || "处理中"
    : `完成 ${n} 个步骤 · ${secs.toFixed(1)} 秒`;

  return (
    <div className="activity">
      <button
        className="act-toggle"
        onClick={onToggle}
        aria-expanded={segment.expanded}
      >
        <span className={segRunning ? "pulse pulse--live" : "pulse"} />
        <span>{label}</span>
        <span className={segment.expanded ? "chev chev--open" : "chev"}>›</span>
      </button>

      {segment.expanded && (
        <div className="act-items">
          {segment.items.map((it, i) => (
            <div className="act-item" key={it.id ?? i}>
              <span className={it.done ? "dot" : "dot dot--live"} />
              <div className="act-body">
                {it.kind === "reasoning" && (
                  <div className="reasoning">{it.text}</div>
                )}

                {it.kind === "tool" && (
                  <div className="tool">
                    <div className="tool-head">
                      <span className="tool-name">{it.name}</span>
                      <span className="tool-args">{it.args}</span>
                    </div>
                    {it.result && <div className="tool-result">{it.result}</div>}
                  </div>
                )}

                {it.kind === "subagent" && (
                  <div className="tool">
                    <div className="tool-head">
                      <span className="sub-label">子任务</span>
                      <span className="tool-name">{it.name}</span>
                      <span className="sub-task">{it.task}</span>
                    </div>
                    {it.result && <div className="tool-result">{it.result}</div>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ agent */

function AgentTurn({
  message,
  isLast,
  showUsage,
  onToggle,
  onFollowUp,
}: {
  message: AgentMessage;
  isLast: boolean;
  showUsage: boolean;
  onToggle: (segment: number) => void;
  onFollowUp: (text: string) => void;
}) {
  const [allSources, setAllSources] = useState(false);
  const running = message.phase !== "done";
  const u = message.usage;
  const usageLine = u
    ? [
        u.model,
        u.inputTokens != null ? `${(u.inputTokens / 1000).toFixed(1)}k in` : null,
        u.outputTokens != null ? `${u.outputTokens} out` : null,
        u.ms != null ? `${(u.ms / 1000).toFixed(1)}s` : null,
      ]
        .filter(Boolean)
        .join("  ·  ")
    : "";

  return (
    <div className="agent">
      {message.segments.map((seg, si) => (
        <div className="seg" key={si}>
          {seg.items.length > 0 && (
            <Activity
              segment={seg}
              running={running}
              status={message.status}
              onToggle={() => onToggle(si)}
            />
          )}
          {seg.text && (
            <div className="answer">
              {/* Only the live segment carries the cursor. `running` alone put one at the end
                  of every segment, so the moment the model wrote a paragraph and then reached
                  for a tool, that finished paragraph kept blinking for the rest of the turn. */}
              <Markdown
                text={seg.text}
                caret={running && si === message.segments.length - 1}
              />
            </div>
          )}
        </div>
      ))}

      {message.error && <div className="err">{message.error}</div>}

      {message.sources.length > 0 && (
        <div className="sources">
          <span className="sources-label">来源</span>
          {(allSources ? message.sources : message.sources.slice(0, SOURCE_LIMIT)).map(
            (src, i) => {
              const href = sourceHref(src);
              const label = <><span className="source-n">{i + 1}</span><span>{src.label}</span></>;
              return href ? (
                <a className="source" key={`${src.label}-${i}`} href={href}
                  target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {label}
                </a>
              ) : <span className="source" key={`${src.label}-${i}`}>{label}</span>;
            },
          )}
          {/* A deep question can touch twenty-odd files. Hiding none of them is honest but
              unreadable, so the count stays visible and the rest are one click away. */}
          {!allSources && message.sources.length > SOURCE_LIMIT && (
            <button className="source source--more" onClick={() => setAllSources(true)}>
              +{message.sources.length - SOURCE_LIMIT} 个来源
            </button>
          )}
        </div>
      )}

      {showUsage && usageLine && !running && (
        <div className="usage">{usageLine}</div>
      )}

      {isLast && !running && message.followUps.length > 0 && (
        <div className="followups">
          {message.followUps.map((label) => (
            <button
              className="followup"
              key={label}
              onClick={() => onFollowUp(label)}
            >
              <span className="arrow">→</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- root */

export default function RongAgent({
  wordmark = PROFILE.site.wordmark,
  showSuggestions = true,
  showUsage = false,
  live = true,
  footerNote = live ? FOOTER_NOTE : OFFLINE_NOTE,
  transport,
}: Props) {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => ({ ...base, draft: readQuestion(window.location.search) }));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const cancelled = useRef(false);
  const appRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const [override, setOverride] = useState<Transport | null>(null);
  const [soundMuted, setSoundMutedState] = useState(isSoundMuted);

  useEffect(() => {
    document.title = `${wordmark} Ragent`;
  }, [wordmark]);

  /* Every turn takes a number, and stop/reset/a new question all bump it. A transport
   * cannot be forced to return the instant it is cancelled — it stops at its next poll —
   * so without this a stopped turn's tail events land on the turn that replaced it, and
   * its final `done` marks the new answer complete while it is still streaming. */
  const turn = useRef(0);

  const active = override ?? transport;

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busyRef.current) return;
      playUiSound("send");
      const myTurn = ++turn.current;
      const current = () => turn.current === myTurn;
      busyRef.current = true;
      cancelled.current = false;
      stickToBottom.current = true;

      // History as the transport sees it: the turns before this question.
      const history = state.messages.map((m) => ({
        role: m.role,
        text: m.role === "user" ? m.text : agentText(m),
      }));

      dispatch({ type: "ask", text: q });

      const emit = (event: AgentEvent) => {
        if (current() && !cancelled.current) dispatch({ type: "event", event });
      };

      try {
        await active({
          message: q,
          history,
          onEvent: emit,
          isCancelled: () => !current() || cancelled.current,
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : "unknown error";
        emit({
          type: "error",
          message: `回答提前终止：${detail}。请重试或缩小问题范围。`,
        });
      }

      if (!current()) return; // stopped, reset, or superseded — that turn already settled
      dispatch({ type: "event", event: { type: "done" } });
      dispatch({ type: "settle" });
      busyRef.current = false;
    },
    [active, state.messages],
  );

  const stop = useCallback(() => {
    turn.current++;
    cancelled.current = true;
    dispatch({ type: "event", event: { type: "done" } });
    dispatch({ type: "settle" });
    busyRef.current = false;
  }, []);

  const reset = useCallback(() => {
    turn.current++;
    cancelled.current = true;
    busyRef.current = false;
    dispatch({ type: "reset" });
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundMuted;
    setSoundMutedState(next);
    setSoundMuted(next);
  }, [soundMuted]);

  // External control surface: any host page, or a test, can drive the thread.
  useEffect(() => {
    window.rongAgent = {
      send: (t: string) => void send(t),
      stop,
      reset,
      setTransport: (fn: Transport) => setOverride(() => fn),
    };
    return () => {
      delete window.rongAgent;
    };
  }, [send, stop, reset]);

  /* The tab icon spins while a turn is in flight. Reading `busyRef` through a getter rather
   * than passing a boolean keeps this effect out of the render path: the icon loop starts once
   * and polls, instead of being torn down and rebuilt on every token that arrives. */
  useEffect(() => startFavicon(() => (busyRef.current ? "busy" : "idle")), []);


  // Follow the stream, but let go the moment the reader scrolls up to re-read something.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [state.messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const suggestions = useMemo(() => SEED_QUESTIONS, []);
  const lastIndex = state.messages.length - 1;

  return (
    <div className="app" ref={appRef}>
      <SiteHeader current="ragent" actions={<>
          {state.started && <button className="new-conversation" onClick={reset}>新对话</button>}
          <button
            className="sound-toggle"
            type="button"
            aria-label={soundMuted ? "开启音效" : "静音"}
            aria-pressed={soundMuted}
            title={soundMuted ? "开启音效" : "静音"}
            onClick={toggleSound}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3.5 8.2h3.1l3.6-3v9.6l-3.6-3H3.5z" />
              {soundMuted ? (
                <path d="m13.5 8 3.2 4m0-4-3.2 4" />
              ) : (
                <path d="M13.6 7.1a4.2 4.2 0 0 1 0 5.8M15.8 5a7.2 7.2 0 0 1 0 10" />
              )}
            </svg>
          </button>
      </>} />

      {!state.started ? (
        <main className="landing" id="main-content">
          <p className="eyebrow question-eyebrow">问答 / 从一个问题开始</p>

          <h1 className="h1">
            关于{" "}
            <span className="tilt">
              {PROFILE.site.wordmark}
            </span>
            ，尽管问
          </h1>


          <p className="question-intro">从一个问题开始，沿着公开资料，了解我的工作。</p>
          <div className="composer-wrap">
            <Composer
              value={state.draft}
              placeholder="想了解贺融的什么经历？"
              rows={2}
              busy={false}
              onChange={(v) => dispatch({ type: "draft", value: v })}
              onSend={() => void send(state.draft)}
              onStop={stop}
            />

            {showSuggestions && (
              <div className="suggestions">
                {suggestions.map((label) => (
                  <button
                    className="chip"
                    key={label}
                    onClick={() => void send(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="question-mode">{live ? "在线问答 · 回答附有来源，请结合原文判断。" : OFFLINE_NOTE}</p>
        </main>
      ) : (
        <main className="chat" id="main-content">
          <div className="scroll" ref={scrollRef} onScroll={onScroll}>
            <div className="thread">
              {state.messages.map((m, mi) =>
                m.role === "user" ? (
                  <div className="msg" key={mi}>
                    <div className="user-row">
                      <div className="user-bubble">{m.text}</div>
                    </div>
                  </div>
                ) : (
                  <div className="msg" key={mi}>
                    <AgentTurn
                      message={m}
                      isLast={mi === lastIndex}
                      showUsage={showUsage}
                      onToggle={(segment) =>
                        dispatch({ type: "toggle", message: mi, segment })
                      }
                      onFollowUp={(text) => void send(text)}
                    />
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="dock">
            <Composer
              value={state.draft}
              placeholder="继续提问…"
              rows={1}
              busy={state.busy}
              dock
              onChange={(v) => dispatch({ type: "draft", value: v })}
              onSend={() => void send(state.draft)}
              onStop={stop}
            />
            <div className="footnote">{footerNote}</div>
          </div>
        </main>
      )}
    </div>
  );
}

/** The visible answer of an agent turn, for history sent back to the model. */
function agentText(m: AgentMessage): string {
  return m.segments
    .map((s) => s.text)
    .filter(Boolean)
    .join("\n\n");
}

declare global {
  interface Window {
    rongAgent?: {
      send: (text: string) => void;
      stop: () => void;
      reset: () => void;
      setTransport: (fn: Transport) => void;
    };
  }
}
