import { useEffect, useRef } from "react";
import { CONTENT } from "../content";
import { EARTH_PLACES } from "./earth-places";

interface Props {
  selection: string | null | undefined;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}
export default function EarthPlacesDialog({
  selection,
  onSelect,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const isOpen = selection !== undefined;
  const place = EARTH_PLACES.find((p) => p.id === selection);
  useEffect(() => {
    if (isOpen) {
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && dialog.current) {
      dialog.current.scrollTop = 0;
      dialog.current
        .querySelector<HTMLElement>("h2")
        ?.focus({ preventScroll: true });
    }
  }, [selection, isOpen]);
  const experiences = CONTENT.resume.experience.filter((e) =>
    place?.recordIds.includes(e.id),
  );
  const awards = CONTENT.resume.awards.filter((e) =>
    place?.recordIds.includes(e.id),
  );
  return (
    <dialog
      ref={dialog}
      className="earth-project-dialog earth-places-dialog"
      aria-labelledby="earth-places-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className="earth-dialog-close"
        onClick={onClose}
        aria-label="关闭地点，返回地球"
      >
        关闭 <span>×</span>
      </button>
      <p className="earth-overline">学习与实践</p>
      <h2 id="earth-places-title" tabIndex={-1}>
        {place ? place.city : "经历坐标"}
      </h2>
      {place ? (
        <>
          <button className="earth-places-back" onClick={() => onSelect(null)}>
            ← 全部地点
          </button>
          <p className="earth-places-caption">
            {place.kind === "experience"
              ? `${experiences.length} 段实习经历`
              : "学术活动"}
          </p>
          {experiences.map((e) => (
            <article className="earth-place-record" key={e.id}>
              <p className="earth-place-period">
                {e.period.start} — {e.period.end}
              </p>
              <h3>{e.organization}</h3>
              <p className="earth-place-role">{e.role}</p>
              <p className="earth-place-summary">{e.summary}</p>
              <details>
                <summary>工作内容</summary>
                <ul>
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </details>
              <a href={`/resume#${e.id}`}>
                在简历中查看 <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
          {awards.map((a) => (
            <article className="earth-place-record" key={a.id}>
              <p className="earth-place-period">{a.date}</p>
              <h3>{a.title}</h3>
            </article>
          ))}
        </>
      ) : (
        <>
          <p className="earth-places-caption">学习与实践，落在世界上的坐标。</p>
          {(["education", "experience", "academic"] as const).map((kind) => {
            const places = EARTH_PLACES.filter((p) => p.kind === kind);
            if (!places.length) return null;
            return (
              <section className="earth-place-group" key={kind}>
                <h3>
                  {kind === "education"
                    ? "教育"
                    : kind === "experience"
                      ? "实习"
                      : "学术活动"}
                </h3>
                {places.map((p) =>
                  p.url ? (
                    <a className="earth-place-row" href={p.url} key={p.id}>
                      <span>
                        {p.label}
                        <small>{p.city} · 学校官网</small>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <button
                      className="earth-place-row"
                      key={p.id}
                      onClick={() => onSelect(p.id)}
                    >
                      <span>
                        {p.label}
                        <small>
                          {p.city} · {p.recordIds.length}{" "}
                          {kind === "experience" ? "段经历" : "项活动"}
                        </small>
                      </span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ),
                )}
              </section>
            );
          })}
        </>
      )}
    </dialog>
  );
}
