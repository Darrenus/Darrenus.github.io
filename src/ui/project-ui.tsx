import SiteHeader from "./SiteHeader";
import { type ContentLink } from "../content";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function statusLabel(link: ContentLink): string {
  if (link.status === "pending") return "待公开";
  if (link.status === "planned") return "即将上线";
  return "";
}

export function ProjectSiteHeader({ current = "projects" }: { current?: "resume" | "projects" }) {
  return <SiteHeader current={current} />;
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
