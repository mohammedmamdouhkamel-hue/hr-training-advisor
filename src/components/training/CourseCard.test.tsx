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

  // Regression: LLM-generated direct course URLs return 404.
  // Find links must ALWAYS point to platform search pages, never direct course pages.
  it('always generates platform search URLs, never direct course links that could 404', () => {
    const platforms: Course['platform'][] = ['youtube', 'coursera', 'udemy', 'linkedin', 'pluralsight', 'aim'];
    const searchDomains: Record<string, string> = {
      youtube: 'youtube.com/results',
      coursera: 'coursera.org/search',
      udemy: 'udemy.com/courses/search',
      linkedin: 'linkedin.com/learning/search',
      pluralsight: 'pluralsight.com/search',
      aim: 'explore.skillbuilder.aws/en/catalog',
    };
    for (const platform of platforms) {
      const course = { ...mockCourse, platform };
      const { unmount } = render(<CourseCard course={course} />);
      const link = screen.getByRole('link', { name: new RegExp(`find.*on ${platform}`, 'i') });
      expect(link).toHaveAttribute('href', expect.stringContaining(searchDomains[platform]));
      unmount();
    }
  });
});
