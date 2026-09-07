import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import {
  OBSERVATIONS,
  nearestRotation,
  normalizeTopic,
  topicFromAngle,
} from "./observations";

const point = (angle: number, radius: number) => ({
  x: 260 + Math.sin((angle * Math.PI) / 180) * radius,
  y: 260 - Math.cos((angle * Math.PI) / 180) * radius,
});

export default function ObservationDial({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (index: number) => void;
}) {
  const id = useId();
  const dial = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; angle: number; rotation: number } | null>(
    null,
  );
  const observation = OBSERVATIONS[selected];
  const select = (index: number) => {
    const next = normalizeTopic(index);
    setRotation((value) => nearestRotation(value, next));
    onSelect(next);
  };
  const angleAt = (e: PointerEvent) => {
    const rect = dial.current!.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientX - rect.left - rect.width / 2,
        -(e.clientY - rect.top - rect.height / 2),
      ) *
        180) /
      Math.PI
    );
  };
  const start = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    drag.current = { id: e.pointerId, angle: angleAt(e), rotation };
    setDragging(true);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.id !== e.pointerId) return;
    const next = angleAt(e);
    const delta = ((next - active.angle + 540) % 360) - 180;
    active.rotation += delta;
    active.angle = next;
    setRotation(active.rotation);
  };
  const finish = (e: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const active = drag.current;
    if (!active || active.id !== e.pointerId) return;
    const next = cancelled ? selected : topicFromAngle(active.rotation);
    setRotation(nearestRotation(active.rotation, next));
    onSelect(next);
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const keyboard = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[
      e.key
    ];
    if (delta !== undefined) {
      e.preventDefault();
      select(selected + delta);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      select(e.key === "Home" ? 0 : 5);
    }
  };
  return (
    <div
      className={`observation-dial${dragging ? " is-dragging" : ""}`}
      ref={dial}
    >
      <svg className="dial-geometry" viewBox="0 0 520 520" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-metal`} cx="28%" cy="12%" r="90%">
            <stop offset="0" stopColor="#756343" stopOpacity=".17" />
            <stop offset=".6" stopColor="#191c16" stopOpacity=".3" />
            <stop offset="1" stopColor="#101310" />
          </radialGradient>
          <clipPath id={`${id}-plate`}>
            <circle cx="260" cy="260" r="153" />
          </clipPath>
        </defs>
        <circle
          cx="260"
          cy="260"
          r="246"
          fill={`url(#${id}-metal)`}
          className="dial-shell"
        />
        <circle cx="260" cy="260" r="239" className="dial-hairline" />
        <circle cx="260" cy="260" r="217" className="dial-hairline" />
        {Array.from({ length: 120 }, (_, i) => {
          const a = point(i * 3, i % 10 === 0 ? 224 : i % 5 === 0 ? 229 : 233);
          const b = point(i * 3, 237);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={
                i % 10 === 0 ? "dial-tick dial-tick--major" : "dial-tick"
              }
            />
          );
        })}
        <circle cx="260" cy="260" r="153" className="dial-rim" />
        <g clipPath={`url(#${id}-plate)`} className="dial-projection">
          {[78, 122, 176, 238].map((r) => (
            <circle key={r} cx="260" cy="329" r={r} />
          ))}
          <ellipse cx="260" cy="260" rx="86" ry="180" />
          <path d="M107 260H413M260 107V413" />
        </g>
        <g className="dial-evidence-lines" key={selected}>
          {[
            { x: 161, y: 315 },
            { x: 354, y: 330 },
            { x: 322, y: 147 },
          ]
            .slice(0, observation.evidence.length)
            .map((p, i) => (
              <g key={i}>
                <path d={`M260 260 L${p.x} ${p.y}`} />
                <circle cx={p.x} cy={p.y} r="3" />
                <text x={p.x + 10} y={p.y + 4}>
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            ))}
        </g>
        <g
          className="dial-needle"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <path d="M258 276L260 28L262 276Z" fill="currentColor" />
          <path d="M260 283V391" className="dial-tick" />
          <circle cx="260" cy="42" r="4" className="dial-target" />
        </g>
        <circle cx="260" cy="260" r="47" className="dial-hub" />
        <circle cx="260" cy="260" r="39" className="dial-hairline" />
        <text className="dial-center-index" x="260" y="266" textAnchor="middle">
          {String(selected + 1).padStart(2, "0")}
        </text>
        <path className="dial-hairline" d="M250 479h20M260 469v20" />
      </svg>
      <div className="dial-topics" role="group" aria-label="选择观测主题">
        {OBSERVATIONS.map((item, index) => {
          const p = point(index * 60, 184);
          return (
            <button
              key={item.label}
              type="button"
              className="dial-topic"
              aria-pressed={selected === index}
              style={
                {
                  "--x": `${(p.x / 520) * 100}%`,
                  "--y": `${(p.y / 520) * 100}%`,
                } as CSSProperties
              }
              onClick={() => select(index)}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div
        className="dial-handle"
        role="slider"
        tabIndex={0}
        aria-label="转动观测指针"
        aria-valuemin={1}
        aria-valuemax={6}
        aria-valuenow={selected + 1}
        aria-valuetext={observation.label}
        aria-describedby="dial-instructions"
        onKeyDown={keyboard}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={(e) => finish(e)}
        onPointerCancel={(e) => finish(e, true)}
        onLostPointerCapture={(e) => finish(e, true)}
      />
    </div>
  );
}
