export const PROFILE = {
  site: {
    title: "RONG Agent",
    wordmark: "RONG",
    language: "zh-CN",
    desiredDomain: "rong.bio",
    description:
      "关于贺融的个人 AI 助手，介绍他的 AI 应用开发、Agent 工程和工业算法经历。",
  },
  person: {
    name: "贺融",
    preferredName: "Allen",
    location: "新加坡",
    headline: "AI 应用开发",
    current: "新加坡国立大学软件工程技术硕士在读",
  },
  links: {
    github: "https://github.com/Darrenus",
    linkedin: "https://www.linkedin.com/in/herong",
    primaryEmail: "hanserong@u.nus.edu",
    secondaryEmail: "hanserong@163.com",
    avatar: "https://avatars.githubusercontent.com/u/145118468?v=4",
    resume: "/resume-zh.pdf" as string | null,
  },
  github: {
    username: "Darrenus",
    accounts: ["Darrenus"] as const,
  },
} as const;

export type Profile = typeof PROFILE;
