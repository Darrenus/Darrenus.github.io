import { CONTENT } from "../content";
import "./site-footer.css";

export default function SiteFooter({home=false}:{home?:boolean}) {
  const publicLinks=CONTENT.profile.links.filter(link=>link.visibility==='public'&&link.status==='active'&&link.url);
  const primary=publicLinks.find(link=>link.id==='primary-email');
  const secondary=publicLinks.find(link=>link.id==='secondary-email');
  const socials=publicLinks.filter(link=>link.id==='github'||link.id==='linkedin');
  return <footer id="site-footer" className="site-footer" aria-label="联系与链接" tabIndex={-1}>
    <div className="site-footer-grid">
      <div className="site-footer-brand">
        <a href="/" className="site-footer-wordmark" aria-label="RONG 首页">RONG<span>贺融</span></a>
        <p>软件开发 · AI应用开发</p>
        <div className="site-footer-socials" aria-label="公开主页">
          {socials.map(link=><a href={link.url!} key={link.id} target="_blank" rel="noopener noreferrer" aria-label={`${link.label}（新窗口）`} title={link.label}>
            {link.id==='github'?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true"><path d="M8 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.9a5.4 5.4 0 0 0-1.5-3.8A5 5 0 0 0 18.7 1S17.5.7 15 2.4a13.3 13.3 0 0 0-7 0C5.5.7 4.3 1 4.3 1a5 5 0 0 0-.1 3.7 5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.2 6.6 6.2 6.9A3.4 3.4 0 0 0 8 18.1V22"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7.5 10v7m0-10v1m4 9v-7m0 3.2c0-4.3 5-4.3 5 0V17"/></svg>}
          </a>)}
        </div>
      </div>
      <div className="site-footer-contact-grid">
        {primary&&<div className="site-footer-block"><h2>联系我</h2><a href={primary.url!}>{primary.display}<span aria-hidden="true">↗</span></a></div>}
        <div className="site-footer-block"><h2>研究与论文</h2><a href="/research">学术研究<span aria-hidden="true">↗</span></a></div>
        {secondary&&<div className="site-footer-block"><h2>备用邮箱</h2><a href={secondary.url!}>{secondary.display}<span aria-hidden="true">↗</span></a></div>}
        <div className="site-footer-block"><h2>项目与经历</h2><div className="site-footer-page-links"><a href="/projects">项目<span aria-hidden="true">↗</span></a><a href="/resume">简历<span aria-hidden="true">↗</span></a></div></div>
      </div>
    </div>
    <div className="site-footer-bottom"><span>© {new Date().getFullYear()} 贺融</span><a href={home?'#earth-home':'/'}>{home?'返回地球':'回到首页'} <span aria-hidden="true">↑</span></a></div>
  </footer>;
}
