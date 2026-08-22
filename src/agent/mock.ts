import type { AgentEvent, Transport } from "./events";
import { CONTENT, profileLink, requiredUrl } from "../content";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Run {
  keywords: string[];
  reasoning: string;
  steps: { name: string; args: string; result: string }[];
  text: string;
  sources: { label: string; url?: string }[];
  suggestions: string[];
}

const { profile, resume } = CONTENT;
const saic = resume.experience.find((entry) => entry.id === "saic-im-ai")!;
const codeloop = resume.projects.find((entry) => entry.id === "coding-agent")!;
const paragraphText = (paragraphs: string[]) => paragraphs.filter(Boolean).join("\n\n");
const publicContact = [
  profileLink("primary-email"),
  profileLink("github"),
  profileLink("linkedin"),
].map((link) => `[${link.display}](${requiredUrl(link)})`);

const RUNS: Run[] = [
  {
    keywords: ["贺融是谁", "介绍", "who", "allen", "rong"],
    reasoning: "先核对个人简介、教育背景与主要工程经历，再提炼职业主线。",
    steps: [
      { name: "retrieve", args: "index:profile 贺融 经历", result: "找到个人简介与经历资料" },
      { name: "read_document", args: "about-about", result: "已读取个人简介与时间线" },
    ],
    text: `${paragraphText(resume.overview.bio)}\n\n${resume.overview.careerNarrative} ${saic.summary}`,
    sources: [
      { label: "贺融是谁" },
      { label: "实习与工程经历" },
      { label: "GitHub", url: requiredUrl(profileLink("github")) },
    ],
    suggestions: ["他在上汽做了什么？", "他有哪些代表项目？"],
  },
  {
    keywords: ["上汽", "智己", "表格", "sql", "planner", "minio", "工作"],
    reasoning: "这个问题涉及业务结果与系统设计，需要同时核对公开口径和技术边界。",
    steps: [
      { name: "retrieve", args: "index:profile 上汽 表格问答", result: "命中上汽 AI 应用开发经历" },
      { name: "read_document", args: "about-experience", result: "已读取公开技术细节" },
    ],
    text: paragraphText([saic.summary, ...saic.highlights]),
    sources: [{ label: "实习与工程经历" }],
    suggestions: ["Planner-Executor 为什么更可控？", "SQL 安全层如何限制模型？"],
  },
  {
    keywords: ["codeloop", "coding agent", "编程助手", "工具调用协议", "swe-bench", "项目"],
    reasoning: "先读取 codeloop 的公开项目范围、工具协议与权限边界，再引用真实仓库地址。",
    steps: [
      { name: "retrieve", args: "index:project codeloop SWE-bench", result: "命中 codeloop 项目资料" },
      { name: "read_document", args: "about-projects", result: "已读取工具协议与评测范围" },
    ],
    text: paragraphText([
      codeloop.summary,
      ...codeloop.highlights,
      `公开代码仓库：[${codeloop.links.find((link) => link.kind === "repository")?.url}](${codeloop.links.find((link) => link.kind === "repository")?.url})。`,
    ]),
    sources: [{ label: "项目经历", url: codeloop.links.find((link) => link.kind === "repository")?.url ?? undefined }],
    suggestions: ["codeloop 的权限分层如何设计？", "SWE-bench 评测比较什么？"],
  },
  {
    keywords: ["经历", "实习", "职业", "career", "experience"],
    reasoning: "按时间读取教育和实习资料，避免把重叠的课程项目写成全职经历。",
    steps: [
      { name: "retrieve", args: "index:profile 时间线 实习", result: "找到四段实习与两段教育经历" },
    ],
    text: `${resume.education[1]!.summary}\n\n${resume.education[0]!.summary}\n\n${resume.overview.careerNarrative}\n\n${resume.experience
      .map((entry) => `${entry.period.start}：${entry.organization}，${entry.role}`)
      .join("；")}`,
    sources: [{ label: "贺融是谁" }, { label: "实习与工程经历" }],
    suggestions: ["他为什么适合 AI 应用岗位？", "介绍一下他的工业算法经历。"],
  },
  {
    keywords: ["教育", "学校", "nus", "kaist", "学历", "education"],
    reasoning: "直接核对学校、学位与日期，并保留在读状态。",
    steps: [
      { name: "retrieve", args: "index:profile 教育 NUS KAIST", result: "命中教育背景资料" },
    ],
    text: resume.education
      .map((entry) => paragraphText([entry.summary, ...entry.highlights]))
      .join("\n\n"),
    sources: [
      { label: "教育背景与语言能力" },
      { label: "NUS", url: requiredUrl(resume.education[0]!.links.find((link) => link.kind === "official")!) },
      { label: "KAIST", url: requiredUrl(resume.education[1]!.links.find((link) => link.kind === "official")!) },
    ],
    suggestions: ["他的技术方向是什么？", "他有哪些获奖和专利申请？"],
  },
  {
    keywords: ["联系", "邮箱", "email", "contact", "github", "linkedin"],
    reasoning: "只返回本人确认的公开联系方式，不暴露手机号。",
    steps: [
      { name: "retrieve", args: "index:profile 联系方式", result: "找到公开邮箱和账号" },
    ],
    text: `可以通过 ${publicContact[0]} 联系贺融。他的公开账号包括 ${publicContact[1]} 和 ${publicContact[2]}。`,
    sources: [{ label: "联系方式" }],
    suggestions: ["他目前在做什么？", "查看他的公开代码。"],
  },
];

const FALLBACK: Run = {
  keywords: [],
  reasoning: "当前没有配置模型，只能从有限的离线预设中匹配；不匹配时应明确说明。",
  steps: [{ name: "retrieve", args: "index:all", result: "离线模式未找到对应预设" }],
  text: `当前版本尚未配置在线模型，所以这里只能回答几类预设问题。你可以询问${profile.person.name}的经历、上汽 AI 应用工作、codeloop、教育背景或联系方式。`,
  sources: [],
  suggestions: ["贺融是谁？", "他做过哪些 AI 项目？"],
};

function pick(message: string): Run {
  const normalized = message.toLowerCase();
  return RUNS.find((run) =>
    run.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  ) ?? FALLBACK;
}

export const mockTransport: Transport = async ({ message, onEvent, isCancelled }) => {
  const run = pick(message);
  const startedAt = Date.now();
  const emit = (event: AgentEvent) => onEvent(event);

  emit({ type: "status", text: "正在检索" });
  for (const part of run.reasoning.split(/(?<=[，。；])/)) {
    if (isCancelled()) return;
    await wait(70);
    emit({ type: "reasoning_delta", text: part });
  }
  emit({ type: "reasoning_end" });

  for (const [index, step] of run.steps.entries()) {
    if (isCancelled()) return;
    const id = `tool-${index}`;
    emit({ type: "tool_start", id, name: step.name, args: step.args });
    await wait(320);
    emit({ type: "tool_end", id, status: "ok", result: step.result });
  }

  for (const chunk of run.text.split(/(?<=\n\n)/)) {
    if (isCancelled()) return;
    await wait(160);
    emit({ type: "text_delta", text: chunk });
  }

  if (run.sources.length) emit({ type: "sources", items: run.sources });
  emit({ type: "suggestions", items: run.suggestions });
  emit({
    type: "usage",
    model: "offline demo",
    inputTokens: 0,
    outputTokens: 0,
    ms: Date.now() - startedAt,
  });
  emit({ type: "done" });
};

export default mockTransport;
