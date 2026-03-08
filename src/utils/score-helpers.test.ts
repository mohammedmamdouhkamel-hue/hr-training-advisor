import { describe, it, expect } from 'vitest';
import { getScoreColor, getScoreLabel } from './score-helpers';

describe('getScoreColor', () => {
  it('returns green for scores >= 80', () => {
    expect(getScoreColor(80)).toBe('#10B981');
    expect(getScoreColor(100)).toBe('#10B981');
    expect(getScoreColor(95)).toBe('#10B981');
  });

  it('returns amber for scores 65-79', () => {
    expect(getScoreColor(65)).toBe('#F59E0B');
    expect(getScoreColor(79)).toBe('#F59E0B');
    expect(getScoreColor(72)).toBe('#F59E0B');
  });

  it('returns red for scores < 65', () => {
    expect(getScoreColor(64)).toBe('#EF4444');
    expect(getScoreColor(0)).toBe('#EF4444');
    expect(getScoreColor(50)).toBe('#EF4444');
  });

  it('handles boundary values exactly', () => {
    expect(getScoreColor(64)).toBe('#EF4444');
    expect(getScoreColor(65)).toBe('#F59E0B');
    expect(getScoreColor(79)).toBe('#F59E0B');
    expect(getScoreColor(80)).toBe('#10B981');
  });
});

describe('getScoreLabel', () => {
  it('returns Strong for scores >= 80', () => {
    expect(getScoreLabel(80)).toBe('Strong');
    expect(getScoreLabel(100)).toBe('Strong');
  });

  it('returns Developing for scores 65-79', () => {
    expect(getScoreLabel(65)).toBe('Developing');
    expect(getScoreLabel(79)).toBe('Developing');
  });

  it('returns Needs Focus for scores < 65', () => {
    expect(getScoreLabel(64)).toBe('Needs Focus');
    expect(getScoreLabel(0)).toBe('Needs Focus');
  });

  it('handles boundary values exactly', () => {
    expect(getScoreLabel(64)).toBe('Needs Focus');
    expect(getScoreLabel(65)).toBe('Developing');
    expect(getScoreLabel(79)).toBe('Developing');
    expect(getScoreLabel(80)).toBe('Strong');
  });
});
