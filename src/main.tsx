import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RongAgent from "./ui/RongAgent";
import { createTransport } from "./agent/transport";
import { hasModel, setByokKey } from "./agent/config";
import "./ui/agent.css";

/* Local development without the proxy: paste a DeepSeek key once from the console.
 *
 *   rongAgentKey("sk-…")   store it and reload
 *   rongAgentKey(null)     forget it
 *
 * It lives in localStorage on your machine only. Kept off the page on purpose — a visible
 * key field on a public site is an invitation to paste a key into someone else's page. */
declare global {
  interface Window {
    rongAgentKey: (key: string | null) => void;
  }
}

window.rongAgentKey = (key) => {
  setByokKey(key);
  location.reload();
};

// The bundle loaded, so whatever stale-HTML recovery index.html did is finished. Clearing
// the flag keeps a genuinely broken deploy from being retried silently forever.
try {
  sessionStorage.removeItem("asset-reload");
} catch {
  /* storage blocked */
}

const root = document.getElementById("root");
if (!root) throw new Error("no #root element");

createRoot(root).render(
  <StrictMode>
    <RongAgent transport={createTransport()} live={hasModel()} />
  </StrictMode>,
);
