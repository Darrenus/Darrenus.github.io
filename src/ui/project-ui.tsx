import { CONTENT, type ContentLink } from "../content";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function statusLabel(link: ContentLink): string {
  if (link.status === "pending") return "待公开";
  if (link.status === "planned") return "即将上线";
  return "";
}

export function ProjectSiteHeader({ current }: { current?: "resume" | "projects" }) {
  const { profile } = CONTENT;
  const avatar = profile.links.find((link) => link.id === "avatar");

  return (
    <header className="projects-header">
      <div className="projects-header-inner">
        <a className="projects-wordmark" href="/" aria-label="返回 RONG Agent 首页">{profile.site.wordmark}</a>
        <nav className="projects-nav" aria-label="主导航">
          <a href="/" aria-current={current === undefined ? "page" : undefined}>Agent</a>
          <a href="/resume" aria-current={current === "resume" ? "page" : undefined}>简历</a>
          <a href="/projects" aria-current={current === "projects" ? "page" : undefined}>项目</a>
          {profile.links.filter((link) => ["github", "linkedin"].includes(link.kind)).map((link) => (
            <a className="projects-nav-external" href={link.url ?? "#"} key={link.id} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
          {avatar?.url && <img className="projects-avatar" src={avatar.url} alt="贺融 GitHub 头像" />}
        </nav>
      </div>
    </header>
  );
}

export function ProjectTags({ tags, className = "" }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return <div className={`project-tags ${className}`.trim()}>{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}

export function ProjectLinks({ links, compact = false }: { links: ContentLink[]; compact?: boolean }) {
  if (links.length === 0) return null;
  return (
    <div className={compact ? "project-links project-links--compact" : "project-links"}>
      {links.map((link) => {
        const label = statusLabel(link);
        if (link.status !== "active" || !link.url) {
          return <span className="project-link project-link--muted" key={`${link.kind}-${link.label}`}>{link.label}{label && <small>{label}</small>}</span>;
        }
        const external = isExternalUrl(link.url);
        return (
          <a className="project-link" href={link.url} key={`${link.kind}-${link.label}`} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
            {link.label} <span aria-hidden="true">{external ? "↗" : "→"}</span>
          </a>
        );
      })}
    </div>
  );
}
