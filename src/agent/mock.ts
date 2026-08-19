import type { AgentEvent, Transport } from "./events";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Run {
  keywords: string[];
  reasoning: string;
  steps: { name: string; args: string; result: string }[];
  text: string;
  sources: { label: string; url?: string }[];
  suggestions: string[];
}

const RUNS: Run[] = [
  {
    keywords: ["贺融是谁", "介绍", "who", "allen", "rong"],
    reasoning: "先核对个人简介、教育背景与主要工程经历，再提炼职业主线。",
    steps: [
      { name: "retrieve", args: "index:profile 贺融 经历", result: "找到个人简介与经历资料" },
      { name: "read_document", args: "about-about", result: "已读取个人简介与时间线" },
    ],
    text:
      "贺融（Allen）是一名面向 AI 应用开发与 Agent 工程的软件工程师，目前在新加坡国立大学攻读软件工程技术硕士。\n\n他的经历横跨大模型应用、工业视觉与控制算法、Web 与自动化开发。主线是把模型能力转化为可控、可执行、可验证的软件系统。2026 年，他在上汽集团（智己汽车）前瞻研发中心参与内部表格问答平台从 Demo 到业务试用的落地。",
    sources: [
      { label: "贺融是谁" },
      { label: "实习与工程经历" },
      { label: "GitHub", url: "https://github.com/Darrenus" },
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
    text:
      "他在上汽集团（智己汽车）前瞻研发中心参与一个内部表格问答平台从 Demo 到业务试用的落地。平台覆盖 FFL、FSL、ICD、信号查询和整车实验数据等场景，并服务 20 多名内部用户。内部评估显示，单名用户平均每天节省约 2 小时人工处理时间。\n\n工程上，他使用 MinIO、MySQL 和消息队列拆分文件处理任务；再把固定工作流重构为 Planner-Executor，将 Schema 检查、SQL 生成与校验、查询执行和图表渲染限制为白名单动作。他还设计只读 SQL 安全层和跨会话记忆。",
    sources: [{ label: "实习与工程经历" }],
    suggestions: ["Planner-Executor 为什么更可控？", "SQL 安全层如何限制模型？"],
  },
  {
    keywords: ["coding agent", "编程助手", "mcp", "react", "plan mode", "项目"],
    reasoning: "先读取项目范围和已经公开的量化结果，不为尚未发布的仓库补造链接。",
    steps: [
      { name: "retrieve", args: "index:project Coding Agent MCP", result: "命中 Coding Agent 项目资料" },
      { name: "read_document", args: "about-projects", result: "已读取架构与测试口径" },
    ],
    text:
      "Coding Agent 是贺融独立设计的终端 AI 编程助手。它使用 ReAct 与 Plan Mode 两种运行模式，并把系统划分为交互、引擎、工具、记忆和安全五层。\n\n核心设计包括 Anthropic 与 OpenAI 协议适配、MCP 工具延迟加载、两层上下文压缩、JSONL 会话记录、五层权限拦截和多 Agent 文件级隔离。在自建的百级工具测试中，延迟加载使工具描述的 Token 占用减少 85%。公开仓库尚未发布，因此当前没有代码链接。",
    sources: [{ label: "项目经历" }],
    suggestions: ["五层权限拦截分别做什么？", "跨会话记忆如何工作？"],
  },
  {
    keywords: ["经历", "实习", "职业", "career", "experience"],
    reasoning: "按时间读取教育和实习资料，避免把重叠的课程项目写成全职经历。",
    steps: [
      { name: "retrieve", args: "index:profile 时间线 实习", result: "找到四段实习与两段教育经历" },
    ],
    text:
      "贺融本科就读于韩国科学技术院计算机科学专业，之后进入新加坡国立大学攻读软件工程技术硕士。\n\n工程经历从 Java Web 和自动化开发开始，随后转向工业视觉算法，再进入 AI 应用开发。2023 年他在上海亚太神通参与 Java Web 系统；2024 年在上海广为电器参与智能展示柜和自动化调试；2025 年在郑州捷安高科参与工业实训的目标检测与姿态识别；2026 年在上汽集团（智己汽车）前瞻研发中心参与内部表格问答平台。",
    sources: [{ label: "贺融是谁" }, { label: "实习与工程经历" }],
    suggestions: ["他为什么适合 AI 应用岗位？", "介绍一下他的工业算法经历。"],
  },
  {
    keywords: ["教育", "学校", "nus", "kaist", "学历", "education"],
    reasoning: "直接核对学校、学位与日期，并保留在读状态。",
    steps: [
      { name: "retrieve", args: "index:profile 教育 NUS KAIST", result: "命中教育背景资料" },
    ],
    text:
      "贺融于 2021 年 9 月至 2025 年 8 月在韩国科学技术院攻读计算机科学本科，简历记录的平均绩点为 86，排名前 5%。他于 2026 年 8 月开始在新加坡国立大学攻读软件工程技术硕士，预计 2027 年 10 月完成学业。",
    sources: [
      { label: "教育背景与语言能力" },
      { label: "NUS", url: "https://nus.edu.sg/" },
      { label: "KAIST", url: "https://www.kaist.ac.kr/en/" },
    ],
    suggestions: ["他的技术方向是什么？", "他有哪些获奖和专利申请？"],
  },
  {
    keywords: ["联系", "邮箱", "email", "contact", "github", "linkedin"],
    reasoning: "只返回本人确认的公开联系方式，不暴露手机号。",
    steps: [
      { name: "retrieve", args: "index:profile 联系方式", result: "找到公开邮箱和账号" },
    ],
    text:
      "可以通过 NUS 邮箱 [hanserong@u.nus.edu](mailto:hanserong@u.nus.edu) 联系贺融。他的公开账号包括 [GitHub](https://github.com/Darrenus) 和 [LinkedIn](https://www.linkedin.com/in/herong)。",
    sources: [{ label: "联系方式" }],
    suggestions: ["他目前在做什么？", "查看他的公开代码。"],
  },
];

const FALLBACK: Run = {
  keywords: [],
  reasoning: "当前没有配置模型，只能从有限的离线预设中匹配；不匹配时应明确说明。",
  steps: [{ name: "retrieve", args: "index:all", result: "离线模式未找到对应预设" }],
  text:
    "当前版本尚未配置在线模型，所以这里只能回答几类预设问题。你可以询问贺融的经历、上汽 AI 应用工作、Coding Agent、教育背景或联系方式。",
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
