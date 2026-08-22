import { useEffect } from "react";
import { CONTENT } from "../content";
import { playUiSound } from "./sound";
import { ParticleSphere, type KnowledgeNode } from "./ParticleSphere";
import PortalTelemetry from "./PortalTelemetry";
import "./portal.css";

function compactNodeLabel(value: string): string {
  const replacements: Array<[string, string]> = [
    ["混合动力无人机能源管理系统", "Hybrid UAV"],
    ["KAIST 校园智慧食堂系统", "Smart Canteen"],
    ["面包爱好者移动应用", "Breadify UX"],
    ["新加坡国立大学", "NUS"],
    ["韩国科学技术院", "KAIST"],
    ["牛客 AI Coding 笔试挑战杯决赛 Top 10", "AI Coding Top 10"],
    ["“国机杯”首届工业智能体大赛优秀奖", "Industrial Agent Award"],
    ["大学生创新创业训练计划项目结题证书（国家级项目）", "Innovation Program"],
    ["美国大学生数学建模竞赛 H 奖", "MCM H Award"],
    ["基于 YOLOv8-OBB 与图卷积神经网络的双排钢管跨越架搭设部件感知方法", "YOLOv8-OBB"],
    ["基于点云与二维图像融合的受电弓检修作业接触识别方法", "Pantograph Vision"],
    ["一种面向电子表格自然语言问答的可审计规划执行方法及系统", "Auditable Spreadsheet QA"],
  ];
  const replacement = replacements.find(([source]) => source === value)?.[1];
  if (replacement) return replacement;
  return value.length > 24 ? `${value.slice(0, 23)}…` : value;
}

function buildKnowledgeNodes(resume: typeof CONTENT.resume): KnowledgeNode[] {
  const labels = [
    ...resume.projects.map((project) => project.name),
    ...resume.education.map((entry) => entry.institution),
    ...resume.experience.flatMap((entry) => entry.tags),
    ...resume.projects.flatMap((project) => project.tags),
    ...resume.skillGroups.flatMap((group) => group.keywords),
    ...resume.awards.map((award) => award.title),
    ...resume.patents.map((patent) => patent.title),
  ].map(compactNodeLabel);
  const unique = [...new Set(labels.filter(Boolean))];
  return unique.slice(0, 56).map((label) => ({ label }));
}

const KNOWLEDGE_NODES = buildKnowledgeNodes(CONTENT.resume);

function PortalCareerRing() {
  return (
    <div className="portal-career-ring" aria-hidden="true">
      <svg viewBox="0 0 1000 280" role="presentation">
        <defs>
          <path id="portal-career-ring-path" d="M 80 140 a 420 92 0 1 0 840 0 a 420 92 0 1 0 -840 0" />
        </defs>
        <text>
          <textPath href="#portal-career-ring-path" startOffset="0%">
            AI AGENT · ALGORITHM ENGINEER · AI AGENT · ALGORITHM ENGINEER · AI AGENT · ALGORITHM ENGINEER · AI AGENT · ALGORITHM ENGINEER · AI AGENT · ALGORITHM ENGINEER ·
            <animate attributeName="startOffset" from="0%" to="-20%" dur="52s" repeatCount="indefinite" />
          </textPath>
        </text>
      </svg>
    </div>
  );
}

export default function PortalHome() {
  const { profile, resume } = CONTENT;
  const ragentPath = profile.site.routes.ragent ?? "/ragent";
  const repositoryUrl = resume.projects
    .flatMap((project) => project.links)
    .find((link) => link.kind === "repository" && link.url)?.url;
  const repository = repositoryUrl?.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+)/)?.[1] ?? `${profile.github.username}/codeloop`;

  useEffect(() => {
    document.title = `${profile.site.wordmark} | ${profile.person.preferredName}`;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "RONG 的个人主页：以 Ragent 为中心，连接中英文简历、公开项目与社交链接。",
    );
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      "href",
      `https://${profile.site.domain}/`,
    );
  }, [profile.person.preferredName, profile.site.domain, profile.site.wordmark]);

  return (
    <div className="portal-page">
      <main className="portal-home" aria-labelledby="portal-title">
        <h1 id="portal-title" className="portal-visually-hidden">{profile.site.wordmark}</h1>
        <div className="portal-stage">
          <div className="portal-sphere">
            <PortalCareerRing />
            <ParticleSphere phase="sphere" nodes={KNOWLEDGE_NODES} />
            <a
              className="portal-core-link"
              href={ragentPath}
              aria-label="打开 Ragent"
              onClick={() => playUiSound("navigate")}
            >
              <span>Ragent</span>
              <small>Ask RONG</small>
            </a>
          </div>
          <PortalTelemetry repository={repository} version={profile.site.version} />
        </div>
      </main>
    </div>
  );
}
