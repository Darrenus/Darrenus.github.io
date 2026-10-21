import { memo, useEffect, useRef, type CSSProperties } from "react";
import "./chat-particles.css";

// Fixed positions avoid a reshuffle when the chat or globe updates.
const POINTS = [
  [18, 12], [73, 7], [47, 23], [87, 33], [11, 43], [65, 48],
  [35, 57], [82, 68], [19, 79], [56, 89], [91, 92], [39, 5],
  [30, 35], [78, 20], [8, 64], [52, 71], [94, 51], [42, 95],
].map(([x, y], index) => ({
  x,
  y,
  size: index % 5 === 0 ? 3 : index % 3 === 0 ? 2 : 1.5,
  opacity: 0.3 + (index % 4) * 0.13,
}));

function ChatParticles({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = root.current;
    const host = layer?.parentElement;
    if (!active || !layer || !host) return;
    const media = window.matchMedia("(min-width: 1001px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const particles = Array.from(layer.querySelectorAll<HTMLElement>(".chat-particle"), element => ({
      element, baseX: 0, baseY: 0, x: 0, y: 0,
    }));
    let frame = 0;
    let lastTime = 0;
    let visible = false;
    let pointer: { x: number; y: number } | null = null;
    const enabled = () => media.matches && visible && !document.hidden;

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      pointer = null;
      particles.forEach(particle => {
        particle.x = particle.y = 0;
        particle.element.style.removeProperty("transform");
      });
    }

    function measure() {
      // offset positions exclude the animated transform; bounds are read only
      // on layout/scroll changes, never on every animation frame.
      particles.forEach(particle => {
        const band = particle.element.parentElement!.getBoundingClientRect();
        particle.baseX = band.left + particle.element.offsetLeft;
        particle.baseY = band.top + particle.element.offsetTop;
      });
      pointer = null;
      if (enabled()) schedule();
    }

    function tick(time: number) {
      frame = 0;
      if (!enabled()) { reset(); return; }
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
      lastTime = time;
      const ease = 1 - Math.exp(-elapsed / 150);
      let unsettled = false;
      particles.forEach(particle => {
        const dx = pointer ? particle.baseX - pointer.x : 0;
        const dy = pointer ? particle.baseY - pointer.y : 0;
        const distance = Math.hypot(dx, dy);
        const influence = pointer ? Math.max(0, 1 - distance / 180) : 0;
        const offset = 14 * influence * influence;
        const targetX = distance > 0 ? dx / distance * offset : 0;
        const targetY = distance > 0 ? dy / distance * offset : 0;
        particle.x += (targetX - particle.x) * ease;
        particle.y += (targetY - particle.y) * ease;
        if (Math.abs(targetX - particle.x) + Math.abs(targetY - particle.y) > 0.025) unsettled = true;
        else { particle.x = targetX; particle.y = targetY; }
        particle.element.style.transform = `translate3d(${particle.x.toFixed(2)}px, ${particle.y.toFixed(2)}px, 0)`;
      });
      if (unsettled) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    }
    function schedule() {
      if (!frame && enabled()) frame = requestAnimationFrame(tick);
    }
    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !enabled()) return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    }
    function leave() { pointer = null; schedule(); }
    function refresh() { reset(); if (enabled()) measure(); }

    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      refresh();
    });
    const resize = new ResizeObserver(measure);
    observer.observe(layer);
    resize.observe(host);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    window.addEventListener("scroll", measure, { passive: true });
    document.addEventListener("visibilitychange", refresh);
    media.addEventListener("change", refresh);
    return () => {
      reset();
      observer.disconnect();
      resize.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", measure);
      document.removeEventListener("visibilitychange", refresh);
      media.removeEventListener("change", refresh);
    };
  }, [active]);

  return (
    <div ref={root} className="chat-particles" aria-hidden="true" data-active={active}>
      {[0, 1].map(side => (
        <div className={`chat-particle-band is-${side === 0 ? "left" : "right"}`} key={side}>
          {POINTS.map((point, index) => (
            <span className="chat-particle" key={index} style={{
              left: `${side === 0 ? point.x : 100 - point.x}%`,
              top: `${side === 0 ? point.y : 100 - point.y}%`,
              "--particle-size": `${point.size}px`,
              opacity: point.opacity,
            } as CSSProperties} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default memo(ChatParticles);
