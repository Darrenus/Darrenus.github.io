import { CONTENT } from "../content";

export interface Evidence {
  label: string;
  detail: string;
  href: string;
}
export interface Observation {
  label: string;
  english: string;
  statement: string;
  question: string;
  evidence: Evidence[];
}

function project(id: string): Evidence {
  const entry = CONTENT.resume.projects.find((item) => item.id === id);
  if (!entry) throw new Error(`Missing observation project: ${id}`);
  return {
    label: entry.name,
    detail: entry.summary,
    href: `/projects/${entry.slug}`,
  };
}
function experience(id: string): Evidence {
  const entry = CONTENT.resume.experience.find((item) => item.id === id);
  if (!entry) throw new Error(`Missing observation experience: ${id}`);
  return {
    label: entry.organization,
    detail: entry.summary,
    href: `/resume#${entry.id}`,
  };
}

// Editorial relationships, each backed by a public record. Geometry never invents a connection.
export const OBSERVATIONS: Observation[] = [
  {
    label: "Agent 工程",
    english: "AGENT SYSTEMS",
    statement: "从模型调用，到可执行的系统。",
    question:
      "贺融如何设计 codeloop 的 Agent 循环？与内部表格问答平台有哪些共同的工程思路？",
    evidence: [project("coding-agent"), experience("saic-im-ai")],
  },
  {
    label: "可靠执行",
    english: "RELIABLE EXECUTION",
    statement: "能力的边界，也应该被设计。",
    question: "贺融如何处理 Agent 的隔离执行、SQL 安全和可回放评测？",
    evidence: [project("coding-agent"), experience("saic-im-ai")],
  },
  {
    label: "工业智能",
    english: "PHYSICAL SYSTEMS",
    statement: "让算法，面对真实世界的约束。",
    question: "贺融在工业视觉和混合动力无人机项目中，如何将算法用于真实系统？",
    evidence: [experience("jantech-industrial-ai"), project("hybrid-uav")],
  },
  {
    label: "产品体验",
    english: "HUMAN EXPERIENCE",
    statement: "先理解使用的人，再定义系统。",
    question:
      "贺融在 Breadify 和 KAIST 智慧食堂项目中如何进行用户研究与产品设计？",
    evidence: [project("breadify"), project("kaist-smart-canteen")],
  },
  {
    label: "软件基础",
    english: "SOFTWARE FOUNDATIONS",
    statement: "复杂系统，建立在清楚的基础上。",
    question: "贺融从 Java Web、自动化开发到 AI 工程的经历如何连接？",
    evidence: [
      experience("apt-java-web"),
      experience("gweee-automation"),
      project("coding-agent"),
    ],
  },
  {
    label: "学习轨迹",
    english: "CONTINUING INQUIRY",
    statement: "从计算机科学，走向软件工程。",
    question: "介绍贺融在 KAIST 与 NUS 的教育经历，以及他的技术发展方向。",
    evidence: CONTENT.resume.education.map((entry) => ({
      label: entry.institution,
      detail: entry.summary,
      href: `/resume#${entry.id}`,
    })),
  },
];

export function normalizeTopic(index: number): number {
  return (
    ((index % OBSERVATIONS.length) + OBSERVATIONS.length) % OBSERVATIONS.length
  );
}
export function topicFromAngle(degrees: number): number {
  return normalizeTopic(Math.round(degrees / 60));
}
export function nearestRotation(current: number, index: number): number {
  return current + ((((index * 60 - current + 540) % 360) + 360) % 360) - 180;
}
export function questionHref(question: string): string {
  return `/ragent?q=${encodeURIComponent(question)}`;
}
export function readQuestion(search: string): string {
  return (new URLSearchParams(search).get("q") ?? "").trim().slice(0, 1200);
}
