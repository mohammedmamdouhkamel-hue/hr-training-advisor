import { describe, it, expect } from 'vitest';
import { getScoreCategory } from './employee';

describe('getScoreCategory', () => {
  it('returns strong for score >= 80', () => {
    expect(getScoreCategory(80)).toBe('strong');
    expect(getScoreCategory(100)).toBe('strong');
  });

  it('returns developing for score 65-79', () => {
    expect(getScoreCategory(65)).toBe('developing');
    expect(getScoreCategory(79)).toBe('developing');
  });

  it('returns needsFocus for score < 65', () => {
    expect(getScoreCategory(64)).toBe('needsFocus');
    expect(getScoreCategory(0)).toBe('needsFocus');
  });
});
