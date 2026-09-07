/** A quiet instrument at rest; motion only while answering, respecting reduced motion. */
export type AgentActivity = "idle" | "busy";
export function startFavicon(getActivity: () => AgentActivity): () => void {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!ctx || !link) return () => {};
  const original = link.href;
  const originalType = link.type;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  let previous = "";
  let frame = 0;
  const draw = () => {
    const busy = getActivity() === "busy";
    const animate = busy && !calm.matches && !document.hidden;
    const state = `${busy}-${animate}`;
    if (previous === state && !animate) return;
    previous = state;
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = "#101310";
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = busy ? "#baa477" : "#8f784f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI * 2);
    ctx.stroke();
    const angle = animate ? frame++ * 0.15 : -0.95;
    ctx.beginPath();
    ctx.moveTo(16 - Math.cos(angle) * 12, 16 - Math.sin(angle) * 12);
    ctx.lineTo(16 + Math.cos(angle) * 12, 16 + Math.sin(angle) * 12);
    ctx.stroke();
    link.type = "image/png";
    link.href = canvas.toDataURL("image/png");
  };
  draw();
  const timer = window.setInterval(draw, 160);
  return () => {
    window.clearInterval(timer);
    link.href = original;
    link.type = originalType;
  };
}
