/**
 * Course Discovery Service
 *
 * Generates deep-link search URLs for training platforms.
 * Each platform is mapped to the most effective search strategy:
 *   - Native platform search when available (YouTube, Coursera, Udemy, LinkedIn Learning)
 *   - Site-scoped Google search for platforms without good public search (Pluralsight, AWS Skill Builder / AIM)
 *   - Generic Google search as a fallback for unrecognized platforms
 */

/** URL builder keyed by normalized platform name. */
const PLATFORM_URL_BUILDERS: Record<string, (query: string) => string> = {
  // YouTube – site-scoped Google search adds "+tutorial" for higher-quality hits
  youtube: (q) =>
    `https://www.google.com/search?q=site:youtube.com+${encodeURIComponent(q)}+tutorial`,

  // Coursera – native public search
  coursera: (q) =>
    `https://www.coursera.org/search?query=${encodeURIComponent(q)}`,

  // LinkedIn Learning – site-scoped Google search (no public API)
  linkedin: (q) =>
    `https://www.google.com/search?q=site:linkedin.com/learning+${encodeURIComponent(q)}`,

  // Udemy – native course search
  udemy: (q) =>
    `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`,

  // Pluralsight – site-scoped Google search targeting /courses paths
  pluralsight: (q) =>
    `https://www.google.com/search?q=site:pluralsight.com/courses+${encodeURIComponent(q)}`,

  // AIM / AWS Skill Builder – site-scoped Google search
  aim: (q) =>
    `https://www.google.com/search?q=site:explore.skillbuilder.aws+${encodeURIComponent(q)}`,
};

/**
 * Aliases map common human-readable names to the canonical key used in
 * PLATFORM_URL_BUILDERS.  All aliases are stored in lower-case.
 */
const PLATFORM_ALIASES: Record<string, string> = {
  'linkedin learning': 'linkedin',
  'linkedin-learning': 'linkedin',
  'aws skill builder': 'aim',
  'aws-skill-builder': 'aim',
  'skillbuilder': 'aim',
  'skill builder': 'aim',
};

/**
 * Normalize a platform name to a canonical key.
 *
 * Resolution order:
 *   1. Direct key match (lower-cased, trimmed)
 *   2. Alias lookup
 *   3. `undefined` (triggers fallback in getCourseSearchUrl)
 */
function normalizePlatform(platform: string): string | undefined {
  const key = platform.trim().toLowerCase();

  if (key in PLATFORM_URL_BUILDERS) {
    return key;
  }

  if (key in PLATFORM_ALIASES) {
    return PLATFORM_ALIASES[key];
  }

  return undefined;
}

/**
 * Return the best deep-link search URL for the given platform and query.
 *
 * @param platform  - Human-readable platform name (case-insensitive).
 *                    Recognised values include every `PlatformKey` as well as
 *                    common aliases such as "LinkedIn Learning" and "AWS Skill Builder".
 * @param searchQuery - The topic / skill to search for.
 * @returns A fully-formed URL that links directly to search results on the
 *          platform, or a Google search fallback for unknown platforms.
 */
export function getCourseSearchUrl(platform: string, searchQuery: string): string {
  const key = normalizePlatform(platform);

  if (key && key in PLATFORM_URL_BUILDERS) {
    return PLATFORM_URL_BUILDERS[key](searchQuery);
  }

  // Fallback: generic Google search scoped to the platform name + "course"
  return `https://www.google.com/search?q=${encodeURIComponent(`${platform} ${searchQuery} course`)}`;
}
