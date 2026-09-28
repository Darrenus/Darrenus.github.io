import type { ReactNode } from "react";
import { CONTENT } from "../content";
import "./site-footer.css";

const icons: Record<string, ReactNode> = {
  github: <path d="M9 21v-3.5c-4 .8-4-2-5-2.5m11 6v-3.5c0-1-.3-1.7-.8-2.2 2.8-.3 5.8-1.4 5.8-6.3 0-1.4-.5-2.6-1.4-3.5.2-.8.2-2-.2-3.2 0 0-1-.3-3.4 1.3a12 12 0 0 0-6 0C6.6 2 5.6 2.3 5.6 2.3c-.4 1.2-.4 2.4-.2 3.2C4.5 6.4 4 7.6 4 9c0 4.9 3 6 5.8 6.3-.5.5-.8 1.2-.8 2.2" />,
  x: <><path d="M4 3h4l12 18h-4L4 3Z" /><path d="m20 3-7 8M4 21l7-8" /></>,
  youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7.5 10v7m0-10v1m4 9v-7m0 3.2c0-4.3 5-4.3 5 0V17" /></>,
};

const socials = [
  ...CONTENT.profile.links.filter(link => link.id === "github" && link.status === "active"),
  { id: "x", label: "X", url: "https://x.com/HHHer111" },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@RongHe-df4zt" },
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/hoooooolyrusher/" },
  ...CONTENT.profile.links.filter(link => link.id === "linkedin" && link.status === "active"),
];

export default function SiteFooter() {
  return (
    <footer id="site-footer" className="site-footer" aria-label="联系与链接" tabIndex={-1}>
      <div className="site-footer-grid">
        <nav className="site-footer-pages" aria-label="页脚导航">
          <a href="/projects">项目</a>
          <a href="/resume">简历</a>
          <a href="/research">学术研究</a>
          <a href="/ragent">问 RONG</a>
        </nav>
        <div className="site-footer-contact">
          <div className="site-footer-socials" aria-label="公开主页">
            {socials.map(link => (
              <a key={link.id} href={link.url!} target="_blank" rel="noopener noreferrer" aria-label={`${link.label}（新窗口）`} title={link.label}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[link.id]}</svg>
              </a>
            ))}
          </div>
          <a className="site-footer-email" href="mailto:hanserong@163.com">hanserong@163.com <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="site-footer-bottom">
        <nav aria-label="网站政策"><a href="/privacy">隐私政策</a><a href="/terms">使用条款</a></nav>
        <span>© 2026 Rong He</span>
      </div>
    </footer>
  );
}
