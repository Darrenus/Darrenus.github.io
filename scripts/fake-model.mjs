/* A scripted stand-in for the model, so the harness can be tested without spending
 * tokens or holding a key.
 *
 *   node scripts/fake-model.mjs                 # listens on :8787
 *   VITE_AGENT_PROXY_URL=http://localhost:8787 npm run dev
 *
 * It speaks the same wire format as the proxy — SSE chat completions with
 * `reasoning_content` and streamed `tool_calls` — and scripts a turn that exercises every
 * branch the UI can render: reasoning, a tool call, a sub-agent, then the answer.
 *
 * The tools it asks for run for real against the real corpus, so a failure here is a
 * failure in the loop or the tools, not in a mock of them.
 */

import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8787);

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};

const REASONING =
  "The question is about the internal spreadsheet Q&A platform. " +
  "Search the approved experience document, then separate architecture facts from measured outcomes.";

const ANSWER = `贺融把固定工作流重构为 Planner-Executor 模式，将 Schema 检查、SQL 生成与校验、查询执行和图表渲染限制为白名单动作。

这使模型负责规划，后端负责经过校验的执行。平台服务 20 多名内部用户；内部评估显示，单名用户平均每天节省约 2 小时人工处理时间。`;

function sse(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

function chunk(delta, finish = null) {
  return {
    id: "fake",
    object: "chat.completion.chunk",
    model: "deepseek-v4-flash",
    choices: [{ index: 0, delta, finish_reason: finish }],
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function streamText(res, text, field = "content") {
  for (const piece of text.match(/[\s\S]{1,24}/g) ?? []) {
    sse(res, chunk({ [field]: piece }));
    await sleep(20);
  }
}

async function streamToolCall(res, name, args) {
  // Fragmented exactly like the real thing: id and name first, then arguments in pieces.
  sse(res, chunk({ tool_calls: [{ index: 0, id: `call_${name}`, type: "function", function: { name, arguments: "" } }] }));
  const json = JSON.stringify(args);
  for (const piece of json.match(/[\s\S]{1,12}/g) ?? []) {
    sse(res, chunk({ tool_calls: [{ index: 0, function: { arguments: piece } }] }));
    await sleep(10);
  }
  sse(res, chunk({}, "tool_calls"));
}

function finishUp(res, inputTokens) {
  sse(res, {
    id: "fake",
    choices: [],
    usage: { prompt_tokens: inputTokens, completion_tokens: 180 },
  });
  res.write("data: [DONE]\n\n");
  res.end();
}

async function handleChat(body, res) {
  const messages = body.messages ?? [];
  const system = String(messages[0]?.content ?? "");
  const toolTurns = messages.filter((m) => m.role === "tool").length;
  const isSubagent = system.startsWith("You are a research sub-agent");
  const isFollowUp = system.includes("Write two likely follow-up questions");

  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache",
    ...CORS,
  });

  if (isFollowUp) {
    await streamText(res, "Planner-Executor 为什么更可控？\nSQL 安全层如何限制模型？");
    sse(res, chunk({}, "stop"));
    return finishUp(res, 400);
  }

  if (isSubagent) {
    if (toolTurns === 0) {
      await streamToolCall(res, "retrieve", { query: "上汽 Planner Executor SQL", index: "profile" });
      return finishUp(res, 900);
    }
    await streamText(
      res,
      "The approved experience document supports the Planner-Executor architecture and the qualified internal evaluation figures.",
    );
    sse(res, chunk({}, "stop"));
    return finishUp(res, 1400);
  }

  if (toolTurns === 0) {
    await streamText(res, REASONING, "reasoning_content");
    await streamToolCall(res, "retrieve", {
      query: "Planner Executor Schema SQL 安全",
      index: "profile",
    });
    return finishUp(res, 2100);
  }

  if (toolTurns === 1) {
    await streamToolCall(res, "spawn_subagent", {
      name: "scope-check",
      task: "Separate the approved architecture facts from the qualified internal evaluation results.",
    });
    return finishUp(res, 4200);
  }

  await streamText(res, ANSWER);
  sse(res, chunk({}, "stop"));
  return finishUp(res, 5600);
}

createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }

  let raw = "";
  req.on("data", (d) => (raw += d));
  req.on("end", async () => {
    const body = raw ? JSON.parse(raw) : {};
    const url = req.url ?? "";

    if (url.startsWith("/api/chat")) {
      console.log(
        `chat · ${body.messages?.length ?? 0} messages · ${body.messages?.filter((m) => m.role === "tool").length ?? 0} tool results`,
      );
      return handleChat(body, res).catch((err) => {
        console.error(err);
        res.end();
      });
    }

    if (url.startsWith("/api/search")) {
      console.log(`search · ${body.query}`);
      res.writeHead(200, { "content-type": "application/json", ...CORS });
      return res.end(
        JSON.stringify({
          results: [
            {
              title: "IM Motors",
              url: "https://www.immotors.com/",
              content: "Scripted search result from scripts/fake-model.mjs.",
            },
          ],
        }),
      );
    }

    if (url.startsWith("/api/fetch")) {
      res.writeHead(200, { "content-type": "application/json", ...CORS });
      return res.end(
        JSON.stringify({ url: body.url, title: "Scripted page", text: "Scripted body text." }),
      );
    }

    res.writeHead(404, CORS);
    res.end("no such route");
  });
}).listen(PORT, () => {
  console.log(`scripted model on http://localhost:${PORT} - point VITE_AGENT_PROXY_URL at it`);
});
