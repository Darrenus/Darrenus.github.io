export type SiteRoute =
  | { kind: "home" }
  | { kind: "resume" }
  | { kind: "projects" }
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
  if (path === "/resume") return { kind: "resume" };
  if (path === "/projects") return { kind: "projects" };

  const projectMatch = /^\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
  if (projectMatch) return { kind: "project", slug: projectMatch[1] };

  return { kind: "not-found" };
}
