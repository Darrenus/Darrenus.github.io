import zh from "../../content/projects.json";
import en from "../../content/projects.en.json";
import { isEnglish } from "../i18n";
import type { ProjectEntry } from "./types";

// The website catalog is curated independently of the projects selected for the CV.
export const PROJECTS: ProjectEntry[] = isEnglish ? en as ProjectEntry[] : zh as ProjectEntry[];
