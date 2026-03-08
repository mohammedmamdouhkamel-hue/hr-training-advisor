import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CourseCard from './CourseCard';
import type { Course } from '../../types/training-plan';

const mockCourse: Course = {
  title: 'Advanced JavaScript',
  platform: 'udemy',
  duration: '8 hours',
  level: 'Advanced',
  description: 'Deep dive into JS concepts',
  search_query: 'advanced javascript',
};

describe('CourseCard', () => {
  it('renders course title', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
  });

  it('renders platform chip', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Udemy')).toBeInTheDocument();
  });

  it('renders duration', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('8 hours')).toBeInTheDocument();
  });

  it('renders level', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Deep dive into JS concepts')).toBeInTheDocument();
  });

  it('renders Find link with correct URL', () => {
    render(<CourseCard course={mockCourse} />);
    const link = screen.getByRole('link', { name: /find advanced javascript on udemy/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('udemy.com'));
    expect(link).toHaveAttribute('href', expect.stringContaining('advanced%20javascript'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('handles unknown platform with Google fallback', () => {
    const unknownCourse = { ...mockCourse, platform: 'unknown' as Course['platform'] };
    render(<CourseCard course={unknownCourse} />);
    const link = screen.getByRole('link', { name: /find advanced javascript on unknown/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/search'));
  });

  it('uses direct URL when a valid course url is provided', () => {
    const courseWithUrl = { ...mockCourse, url: 'https://www.udemy.com/course/advanced-javascript/' };
    render(<CourseCard course={courseWithUrl} />);
    const link = screen.getByRole('link', { name: /find advanced javascript on udemy/i });
    expect(link).toHaveAttribute('href', 'https://www.udemy.com/course/advanced-javascript/');
  });

  it('falls back to search URL when direct url is invalid', () => {
    const courseWithBadUrl = { ...mockCourse, url: 'not-a-url' };
    render(<CourseCard course={courseWithBadUrl} />);
    const link = screen.getByRole('link', { name: /find advanced javascript on udemy/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('udemy.com/courses/search'));
  });

  it('falls back to search URL when url is empty', () => {
    const courseNoUrl = { ...mockCourse, url: '' };
    render(<CourseCard course={courseNoUrl} />);
    const link = screen.getByRole('link', { name: /find advanced javascript on udemy/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('udemy.com/courses/search'));
  });

  it('rejects URL that does not match the assigned platform domain', () => {
    const wrongPlatform = { ...mockCourse, url: 'https://www.coursera.org/learn/javascript' };
    render(<CourseCard course={wrongPlatform} />);
    const link = screen.getByRole('link', { name: /find advanced javascript on udemy/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('udemy.com/courses/search'));
  });

  it('rejects search-page URL that lacks a course-specific path', () => {
    const searchPageUrl = { ...mockCourse, url: 'https://www.udemy.com/courses/search/?q=javascript' };
    render(<CourseCard course={searchPageUrl} />);
    const link = screen.getByRole('link', { name: /find advanced javascript on udemy/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('udemy.com/courses/search'));
  });

  it('accepts valid direct URLs for each platform', () => {
    const cases: { platform: Course['platform']; url: string }[] = [
      { platform: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      { platform: 'coursera', url: 'https://www.coursera.org/learn/machine-learning' },
      { platform: 'linkedin', url: 'https://www.linkedin.com/learning/javascript-essential-training' },
      { platform: 'pluralsight', url: 'https://www.pluralsight.com/courses/javascript-getting-started' },
      { platform: 'aim', url: 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials' },
    ];
    for (const { platform, url } of cases) {
      const course = { ...mockCourse, platform, url };
      const { unmount } = render(<CourseCard course={course} />);
      const link = screen.getByRole('link', { name: new RegExp(`find.*on ${platform}`, 'i') });
      expect(link).toHaveAttribute('href', url);
      unmount();
    }
  });
});
