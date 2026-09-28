export type SiteRoute =
  | { kind: "home" }
  | { kind: "ragent" }
  | { kind: "resume" }
  | { kind: "projects" }
  | { kind: "research" }
  | { kind: "blog" }
  | { kind: "privacy" }
  | { kind: "terms" }
  | { kind: "project"; slug: string }
  | { kind: "not-found" };

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return path.replace(/\/+$/, "") || "/";
}

export function parseRoute(pathname: string): SiteRoute {
  const path = normalizePath(pathname);
  if (path === "/") return { kind: "home" };
  if (path === "/ragent") return { kind: "ragent" };
  if (path === "/resume") return { kind: "resume" };
  if (path === "/privacy") return { kind: "privacy" };
  if (path === "/terms") return { kind: "terms" };
  if (path === "/blog") return { kind: "blog" };
  if (path === "/research") return { kind: "research" };
  if (path === "/projects") return { kind: "projects" };

  const projectMatch = /^\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
  if (projectMatch) return { kind: "project", slug: projectMatch[1] };

  return { kind: "not-found" };
}
