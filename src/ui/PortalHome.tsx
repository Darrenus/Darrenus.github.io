import { useEffect } from "react";
import { CONTENT } from "../content";
import { playUiSound } from "./sound";
import { ParticleSphere } from "./ParticleSphere";
import "./portal.css";

export default function PortalHome() {
  const { profile } = CONTENT;
  const ragentPath = profile.site.routes.ragent ?? "/ragent";

  useEffect(() => {
    document.title = `${profile.site.wordmark} | ${profile.person.preferredName}`;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "RONG 的个人主页：以 Ragent 为中心，连接简历、公开项目与社交链接。",
    );
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      "href",
      `https://${profile.site.domain}/`,
    );
  }, [profile.person.preferredName, profile.site.domain, profile.site.wordmark]);

  const github = profile.links.find((link) => link.kind === "github");
  const linkedin = profile.links.find((link) => link.kind === "linkedin");

  return (
    <div className="portal-page">
      <main className="portal-home" aria-labelledby="portal-title">
        <h1 id="portal-title" className="portal-visually-hidden">{profile.site.wordmark}</h1>
        <div className="portal-stage">
          <div className="portal-sphere">
            <ParticleSphere phase="sphere" />
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

          <nav className="portal-links" aria-label="RONG 入口">
            <a
              className="portal-link portal-link--resume"
              href={profile.site.routes.resume}
              onClick={() => playUiSound("navigate")}
            >
              <span>简历</span>
              <small>Resume</small>
            </a>
            {github?.url && (
              <a className="portal-link portal-link--github" href={github.url} target="_blank" rel="noreferrer">
                <span>GitHub</span>
                <small>Code</small>
              </a>
            )}
            {linkedin?.url && (
              <a className="portal-link portal-link--linkedin" href={linkedin.url} target="_blank" rel="noreferrer">
                <span>LinkedIn</span>
                <small>Network</small>
              </a>
            )}
          </nav>
        </div>
      </main>
    </div>
  );
}
