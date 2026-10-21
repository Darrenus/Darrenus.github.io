import { memo, useEffect, useRef, type CSSProperties } from "react";
import { isEnglish } from "../i18n";
import { CONSTELLATIONS, DUST, limitAngle, projectStar, type Constellation } from "./constellations";
import "./chat-particles.css";

const FIELD_DUST = DUST.filter((_, index) => index % 3 === 0);
// The loose background bridges the constellations instead of framing each one.
const AMBIENT_STARS = [
  [[8, 7], [66, 2], [93, 17], [34, 26], [3, 35], [75, 38], [48, 44], [94, 51], [18, 57], [7, 73], [64, 76], [86, 84], [38, 91], [5, 97], [77, 99], [31, 11], [52, 66]],
  [[87, 4], [22, 9], [56, 1], [8, 24], [93, 32], [45, 37], [72, 46], [18, 51], [98, 62], [53, 68], [84, 75], [6, 83], [39, 89], [68, 96], [96, 91], [66, 19], [31, 59]],
];

function StarField({ constellation, active }: { constellation: Constellation; active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    if (!host || !active) return;
    const media = window.matchMedia("(min-width: 1101px) and (hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dots = [...host.querySelectorAll<SVGGElement>(".constellation-dot")];
    const lines = [...host.querySelectorAll<SVGLineElement>("line")];
    const points = [...constellation.stars, ...FIELD_DUST];
    let pitch = 0, yaw = 0, targetPitch = 0, targetYaw = 0;
    let hoverPitch = 0, hoverYaw = 0;
    let frame = 0, lastTime = 0, visible = false;
    let drag: { id: number; x: number; y: number } | null = null;
    const enabled = () => media.matches && visible && !document.hidden;

    function paint() {
      const projected = points.map(point => projectStar(point, pitch, yaw));
      dots.forEach((dot, index) => {
        const point = projected[index];
        dot.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) scale(${point.scale.toFixed(3)})`);
      });
      lines.forEach((line, index) => {
        const [from, to] = constellation.edges[index];
        line.setAttribute("x1", String(projected[from].x));
        line.setAttribute("y1", String(projected[from].y));
        line.setAttribute("x2", String(projected[to].x));
        line.setAttribute("y2", String(projected[to].y));
      });
    }
    function tick(time: number) {
      frame = 0;
      if (!enabled()) return;
      const ease = reduced.matches ? 1 : 1 - Math.exp(-Math.min(lastTime ? time - lastTime : 16, 50) / 110);
      lastTime = time;
      const nextPitch = limitAngle(targetPitch + hoverPitch);
      const nextYaw = limitAngle(targetYaw + hoverYaw);
      pitch += (nextPitch - pitch) * ease;
      yaw += (nextYaw - yaw) * ease;
      const settling = Math.abs(nextPitch - pitch) + Math.abs(nextYaw - yaw) > 0.0002;
      if (!settling) { pitch = nextPitch; yaw = nextYaw; lastTime = 0; }
      paint();
      if (settling) frame = requestAnimationFrame(tick);
    }
    function schedule() { if (!frame && enabled()) frame = requestAnimationFrame(tick); }
    function down(event: PointerEvent) {
      if (!enabled() || event.button !== 0 || event.pointerType !== "mouse") return;
      event.stopPropagation();
      host!.focus({ preventScroll: true });
      host!.setPointerCapture(event.pointerId);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      hoverPitch = hoverYaw = 0;
      host!.dataset.dragging = "true";
    }
    function move(event: PointerEvent) {
      if (!enabled() || event.pointerType !== "mouse") return;
      if (drag && drag.id === event.pointerId) {
        targetYaw = limitAngle(targetYaw + (event.clientX - drag.x) * 0.007);
        targetPitch = limitAngle(targetPitch - (event.clientY - drag.y) * 0.007);
        drag.x = event.clientX; drag.y = event.clientY;
      } else if (!reduced.matches) {
        const bounds = host!.getBoundingClientRect();
        hoverYaw = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.12;
        hoverPitch = -((event.clientY - bounds.top) / bounds.height - 0.5) * 0.12;
      }
      schedule();
    }
    function release() {
      const id = drag?.id;
      drag = null;
      host!.dataset.dragging = "false";
      if (id !== undefined && host!.hasPointerCapture(id)) host!.releasePointerCapture(id);
    }
    function leave() { if (!drag) { hoverPitch = hoverYaw = 0; schedule(); } }
    function reset() { targetPitch = targetYaw = hoverPitch = hoverYaw = 0; schedule(); }
    function key(event: KeyboardEvent) {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key) || !enabled()) return;
      event.preventDefault(); event.stopPropagation();
      hoverPitch = hoverYaw = 0;
      if (event.key === "Home") reset();
      else {
        targetYaw = limitAngle(targetYaw + (event.key === "ArrowRight" ? 0.12 : event.key === "ArrowLeft" ? -0.12 : 0));
        targetPitch = limitAngle(targetPitch + (event.key === "ArrowUp" ? 0.12 : event.key === "ArrowDown" ? -0.12 : 0));
        schedule();
      }
    }
    function suspend() {
      release(); cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      hoverPitch = hoverYaw = 0;
      pitch = targetPitch; yaw = targetYaw;
      paint();
    }
    function refresh() { suspend(); schedule(); }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; refresh(); });
    observer.observe(host);
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerup", release);
    host.addEventListener("pointercancel", release);
    host.addEventListener("lostpointercapture", release);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("dblclick", reset);
    host.addEventListener("keydown", key);
    window.addEventListener("blur", suspend);
    document.addEventListener("visibilitychange", refresh);
    media.addEventListener("change", refresh);
    reduced.addEventListener("change", refresh);
    return () => {
      suspend(); observer.disconnect();
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", release);
      host.removeEventListener("pointercancel", release);
      host.removeEventListener("lostpointercapture", release);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("dblclick", reset);
      host.removeEventListener("keydown", key);
      window.removeEventListener("blur", suspend);
      document.removeEventListener("visibilitychange", refresh);
      media.removeEventListener("change", refresh);
      reduced.removeEventListener("change", refresh);
    };
  }, [constellation, active]);

  const name = isEnglish ? constellation.english : constellation.name;
  const hint = isEnglish ? "Drag to rotate · Double-click to reset" : "拖动旋转 · 双击复位";
  return (
    <div ref={root} className="constellation-field" data-constellation={constellation.english} role="group" tabIndex={active ? 0 : -1}
      aria-label={`${name} · ${hint}${isEnglish ? ". Arrow keys rotate; Home resets." : "。方向键旋转，Home 复位。"}`}>
      <svg viewBox="0 0 240 160" aria-hidden="true">
        <g className="constellation-lines">
          {constellation.edges.map(([from, to], index) => {
            const a = projectStar(constellation.stars[from], 0, 0), b = projectStar(constellation.stars[to], 0, 0);
            return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
        {[...constellation.stars, ...FIELD_DUST].map((point, index) => {
          const position = projectStar(point, 0, 0);
          const main = index < constellation.stars.length;
          return <g key={index} className={`constellation-dot ${main ? "is-star" : "is-dust"}`} transform={`translate(${position.x} ${position.y})`}>
            {main && <circle r={5} className="star-halo" />}
            <circle r={main ? (index % 3 === 0 ? 1.8 : 1.35) : 0.55 + (index % 3) * 0.18} opacity={main ? 1 : 0.3 + (index % 4) * 0.12} />
          </g>;
        })}
      </svg>
    </div>
  );
}

function ChatParticles({ active }: { active: boolean }) {
  return <div className="chat-particles" data-active={active} aria-hidden={!active} inert={!active}>
    {[0, 1].map(side => <div className={`chat-particle-band is-${side === 0 ? "left" : "right"}`} key={side}>
      <div className="ambient-stars" aria-hidden="true">
        {AMBIENT_STARS[side].map(([x, y], index) => <span key={index} style={{
          left: `${x}%`, top: `${y}%`,
          "--star-size": `${index % 5 === 0 ? 1.8 : 1.1}px`,
          opacity: 0.2 + (index % 4) * 0.09,
        } as CSSProperties} />)}
      </div>
      {CONSTELLATIONS.slice(side * 2, side * 2 + 2).map(constellation => <StarField key={constellation.name} constellation={constellation} active={active} />)}
    </div>)}
  </div>;
}

export default memo(ChatParticles);
