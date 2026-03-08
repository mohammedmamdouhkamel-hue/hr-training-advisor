/**
 * Course Discovery Service
 *
 * Generates deep-link search URLs for training platforms.
 * All platforms use native search URLs for direct results without a Google intermediary.
 * Falls back to generic Google search for unrecognized platforms.
 */

/** URL builder keyed by normalized platform name. */
const PLATFORM_URL_BUILDERS: Record<string, (query: string) => string> = {
  // YouTube – native search results page
  youtube: (q) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,

  // Coursera – native course search
  coursera: (q) =>
    `https://www.coursera.org/search?query=${encodeURIComponent(q)}`,

  // LinkedIn Learning – native search
  linkedin: (q) =>
    `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(q)}`,

  // Udemy – native course search
  udemy: (q) =>
    `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`,

  // Pluralsight – native search
  pluralsight: (q) =>
    `https://www.pluralsight.com/search?q=${encodeURIComponent(q)}`,

  // AIM / AWS Skill Builder – native catalog search
  aim: (q) =>
    `https://explore.skillbuilder.aws/en/catalog?searchText=${encodeURIComponent(q)}`,
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
