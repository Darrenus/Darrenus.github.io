import { CONTENT } from "../content";
import type { ReactNode } from "react";

export default function SiteHeader({
  current,
  actions,
}: {
  current?: "home" | "projects" | "resume" | "research" | "ragent";
  actions?: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        跳至内容
      </a>
      <header className="site-header">
        <a className="site-wordmark" href="/" aria-label="RONG 首页">
          <span className="wordmark-orbit" aria-hidden="true" />
          {CONTENT.profile.site.wordmark}
          <span className="wordmark-edition"> / 贺融</span>
        </a>
        <nav className="site-nav" aria-label="主导航">
          {(
            [
              { id: "home", href: "/", label: "观测台" },
              { id: "projects", href: "/projects", label: "项目" },
              { id: "research", href: "/research", label: "学术研究" },
              { id: "resume", href: "/resume", label: "简历" },
              { id: "ragent", href: "/ragent", label: "问 RONG" },
            ] as const
          ).map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={current === item.id ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {actions && <div className="site-actions">{actions}</div>}
      </header>
    </>
  );
}
