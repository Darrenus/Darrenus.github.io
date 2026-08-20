import { CONTENT, profileLink, requiredUrl } from "./content";

/**
 * Compatibility adapter for the existing UI and agent tools.
 * New content should be edited in `content/profile.json`, not here.
 */
export const PROFILE = {
  site: {
    title: CONTENT.profile.site.title,
    wordmark: CONTENT.profile.site.wordmark,
    language: CONTENT.profile.site.language,
    desiredDomain: CONTENT.profile.site.domain,
    description: CONTENT.profile.site.description,
    routes: CONTENT.profile.site.routes,
  },
  person: CONTENT.profile.person,
  links: {
    github: requiredUrl(profileLink("github")),
    linkedin: requiredUrl(profileLink("linkedin")),
    primaryEmail: profileLink("primary-email").display,
    secondaryEmail: profileLink("secondary-email").display,
    avatar: requiredUrl(profileLink("avatar")),
    resume: profileLink("resume-pdf").url,
  },
  github: CONTENT.profile.github,
} as const;

export type Profile = typeof PROFILE;
