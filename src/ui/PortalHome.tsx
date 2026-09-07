import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { CONTENT } from "../content";
import type { EarthControls } from "./EarthScene";
import "./earth.css";

const EarthScene = lazy(() => import("./EarthScene"));
export default function PortalHome() {
  const [zoom, setZoom] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [opened, setOpened] = useState(false);
  const [projectIndex, setProjectIndex] = useState(0);
  const controls = useRef<EarthControls>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const reportZoom = useCallback((value: number) => setZoom(value), []);
  const reportStatus = useCallback(
    (value: "ready" | "fallback") => setStatus(value),
    [],
  );
  const project = CONTENT.resume.projects[projectIndex];
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changeMotion = () => {
      if (motion.matches) setPaused(true);
    };
    motion.addEventListener("change", changeMotion);
    document.title = "RONG · 贺融 | A world in motion";
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute(
        "content",
        "贺融 Allen He 的个人空间。探索 AI Agent、工业算法与产品设计。",
      );
    return () => motion.removeEventListener("change", changeMotion);
  }, []);
  const close = () => {
    dialog.current?.close();
    setOpened(false);
    openButton.current?.focus();
  };
  const open = () => {
    setOpened(true);
    dialog.current?.showModal();
  };
  return (
    <main
      className={`earth-page is-${status}${opened ? " is-exploring" : ""}`}
      style={{ "--journey": zoom } as CSSProperties}
    >
      <div className="earth-background" aria-hidden="true" />
      <div className="earth-large-type" aria-hidden="true">
        RONG
      </div>
      <Suspense fallback={null}>
        <EarthScene
          ref={controls}
          paused={paused || opened}
          onZoom={reportZoom}
          onReady={reportStatus}
        />
      </Suspense>
      {status === "fallback" && (
        <div className="earth-fallback" aria-hidden="true" />
      )}
      <div className="earth-vignette" aria-hidden="true" />
      <header className="earth-header">
        <a className="earth-logo" href="/" aria-label="RONG 首页">
          <span className="earth-logo-mark" aria-hidden="true">
            ⊕
          </span>{" "}
          RONG
        </a>
        <span className="earth-header-caption">A PERSONAL UNIVERSE</span>
        <nav aria-label="主导航">
          <a href="/projects">
            项目 <span aria-hidden="true">↗</span>
          </a>
          <a href="/resume">
            简历 <span aria-hidden="true">↗</span>
          </a>
          <a className="earth-ask" href="/ragent">
            问 RONG <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <div className="earth-side-label" aria-hidden="true">
        CURIOSITY / SYSTEMS / POSSIBILITY
      </div>
      <div className="earth-identity">
        <p className="earth-overline">
          贺融 <span>ALLEN HE</span>
        </p>
        <h1>
          保持好奇。
          <br />
          <span>向未知，进一步。</span>
        </h1>
        <p className="earth-role">AI 应用开发 · Agent 工程</p>
      </div>
      <button
        className="earth-explore"
        aria-label="探索我的工作"
        onClick={open}
        ref={openButton}
      >
        <span className="earth-explore-orbit" aria-hidden="true">
          <span>↗</span>
        </span>
        <span>
          探索我的工作<small>SELECTED WORK</small>
        </span>
      </button>
      <div className="earth-near-caption" aria-hidden={zoom < 0.5}>
        <span>01 / CLOSER</span>
        <p>
          视角改变，
          <br />
          新的联系开始浮现。
        </p>
      </div>
      <footer className="earth-footer">
        <div className="earth-location">
          <span className="earth-location-dot" /> SINGAPORE
          <small>NUS · KAIST</small>
        </div>
        <div className="earth-instructions">
          <span className="earth-scroll-mark" aria-hidden="true" />
          <span>
            {status === "loading"
              ? "正在构建地球…"
              : status === "fallback"
                ? "当前设备使用静态视图"
                : zoom > 0.85
                  ? "继续向下转动地表 · 向上拉远"
                  : "向下滚动靠近 · 拖动环绕"}
            <small>
              {status === "fallback"
                ? "项目、简历与问答仍可访问"
                : "也可使用缩放按钮 · 手机支持双指缩放"}
            </small>
          </span>
        </div>
        <div className="earth-controls" aria-label="地球视角控制">
          <button
            onClick={() => controls.current?.zoomBy(-0.18)}
            aria-label="缩小地球"
            disabled={status !== "ready" || zoom < 0.01}
          >
            −
          </button>
          <span className="earth-zoom-readout" aria-live="off">
            {Math.round(zoom * 100)
              .toString()
              .padStart(2, "0")}
            <small> / 100</small>
          </span>
          <button
            onClick={() => controls.current?.zoomBy(0.18)}
            aria-label="放大地球"
            disabled={status !== "ready" || zoom > 0.99}
          >
            +
          </button>
          <button
            className="earth-reset"
            onClick={() => controls.current?.reset()}
            aria-label="重置视角"
            disabled={status !== "ready"}
          >
            ↺
          </button>
          <button
            className="earth-pause"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "开启自转" : "暂停自转"}
            disabled={status !== "ready"}
          >
            {paused ? "▷" : "Ⅱ"}
          </button>
        </div>
      </footer>
      <dialog
        className="earth-project-dialog"
        ref={dialog}
        onCancel={close}
        onClose={() => {
          setOpened(false);
          openButton.current?.focus();
        }}
        aria-labelledby="earth-project-title"
        onClick={(e) => {
          if (e.target === dialog.current) {
            const r = dialog.current.getBoundingClientRect();
            if (
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom
            )
              close();
          }
        }}
      >
        <button
          className="earth-dialog-close"
          onClick={close}
          aria-label="关闭项目，返回地球"
        >
          关闭 <span>×</span>
        </button>
        <p className="earth-overline">
          SELECTED WORK{" "}
          <span>{String(projectIndex + 1).padStart(2, "0")} / 04</span>
        </p>
        <div className="earth-project-tabs" role="group" aria-label="选择项目">
          {CONTENT.resume.projects.map((item, i) => (
            <button
              key={item.id}
              aria-pressed={i === projectIndex}
              onClick={() => setProjectIndex(i)}
              aria-label={`查看${item.name}`}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
        <div className="earth-project-record" key={project.id}>
          <p className="earth-project-category">
            {project.tags.slice(0, 2).join(" / ")}
          </p>
          <h2 id="earth-project-title">{project.name}</h2>
          <p>{project.summary}</p>
          <a className="earth-project-link" href={`/projects/${project.slug}`}>
            进入项目 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <a className="earth-dialog-all" href="/projects">
          全部项目 <span aria-hidden="true">→</span>
        </a>
      </dialog>
    </main>
  );
}
