import { memo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Course } from '../../types/training-plan';
import { getCourseSearchUrl } from '../../services/course-discovery';
import PlatformChip from '../shared/PlatformChip';

interface CourseCardProps {
  course: Course;
}

/**
 * Expected hostname patterns per platform.
 * A URL is only accepted if it matches the expected platform domain AND
 * contains a course-specific path segment (not just a search/home page).
 */
const PLATFORM_URL_PATTERNS: Record<string, { host: string; pathHint: RegExp }> = {
  youtube:     { host: 'youtube.com',              pathHint: /\/(watch|playlist)\?/ },
  coursera:    { host: 'coursera.org',             pathHint: /\/(learn|specializations|professional-certificates)\// },
  linkedin:    { host: 'linkedin.com',             pathHint: /\/learning\/.+/ },
  udemy:       { host: 'udemy.com',                pathHint: /\/course\/.+/ },
  pluralsight: { host: 'pluralsight.com',          pathHint: /\/courses?\/.+/ },
  aim:         { host: 'explore.skillbuilder.aws', pathHint: /\/learn\/course\// },
};

/** Validate that a URL is a real direct course link for the given platform. */
function isValidCourseUrl(url: string | undefined, platform: string): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const pattern = PLATFORM_URL_PATTERNS[platform.toLowerCase()];
    if (!pattern) return false;
    if (!parsed.hostname.endsWith(pattern.host)) return false;
    return pattern.pathHint.test(parsed.pathname + parsed.search);
  } catch {
    return false;
  }
}

export default memo(function CourseCard({ course }: CourseCardProps) {
  const url = isValidCourseUrl(course.url, course.platform)
    ? course.url
    : getCourseSearchUrl(course.platform, course.search_query || course.title);

  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{course.title}</div>
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Find ${course.title} on ${course.platform}`}
          style={{ background: '#0F172A', color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          Find <ExternalLink size={10} />
        </a>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <PlatformChip platform={course.platform} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-code-bg)', borderRadius: 20, padding: '3px 10px' }}>{course.duration}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-code-bg)', borderRadius: 20, padding: '3px 10px' }}>{course.level}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{course.description}</p>
    </div>
  );
});
