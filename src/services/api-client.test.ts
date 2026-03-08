import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTrainingPlan } from './api-client';
import type { Employee } from '../types/employee';

const mockEmployee: Employee = {
  name: 'Alice',
  role: 'Engineer',
  department: 'Tech',
  score: 58,
  competencies: {
    'Technical Skills': 55,
    'Communication': 72,
    'Problem Solving': 60,
    'Teamwork': 78,
    'Leadership': 45,
  },
};

const mockPlanResponse = {
  summary: 'Alice needs improvement',
  priority_areas: ['Leadership', 'Technical Skills', 'Problem Solving'],
  training_plan: [
    {
      area: 'Leadership',
      current_score: 45,
      target_score: 70,
      courses: [
        { title: 'Leadership 101', platform: 'youtube', duration: '4 hours', level: 'Beginner', description: 'Intro', search_query: 'leadership basics' },
        { title: 'Leading Teams', platform: 'coursera', duration: '6 hours', level: 'Intermediate', description: 'Teams', search_query: 'team leadership' },
      ],
    },
    {
      area: 'Technical Skills',
      current_score: 55,
      target_score: 75,
      courses: [
        { title: 'Advanced JS', platform: 'udemy', duration: '8 hours', level: 'Advanced', description: 'JS deep dive', search_query: 'javascript advanced' },
        { title: 'System Design', platform: 'pluralsight', duration: '5 hours', level: 'Intermediate', description: 'Design', search_query: 'system design' },
      ],
    },
    {
      area: 'Problem Solving',
      current_score: 60,
      target_score: 80,
      courses: [
        { title: 'Algorithms', platform: 'aim', duration: '10 hours', level: 'Intermediate', description: 'Algo', search_query: 'algorithms' },
        { title: 'Critical Thinking', platform: 'linkedin', duration: '3 hours', level: 'Beginner', description: 'Thinking', search_query: 'critical thinking' },
      ],
    },
  ],
  milestones: [
    { week: 'Week 1-2', goal: 'Complete intro courses' },
    { week: 'Week 3-6', goal: 'Apply skills' },
    { week: 'Week 7-12', goal: 'Demonstrate improvement' },
  ],
  expected_improvement: '+15 points',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('generateTrainingPlan', () => {
  it('returns a valid training plan on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(mockPlanResponse) }],
      }),
    } as Response);

    const plan = await generateTrainingPlan(mockEmployee, 'sk-ant-test-key');
    expect(plan.summary).toBe('Alice needs improvement');
    expect(plan.priority_areas).toHaveLength(3);
    expect(plan.training_plan).toHaveLength(3);
    expect(plan.milestones).toHaveLength(3);
  });

  it('throws on 401 unauthorized', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    } as Response);

    await expect(generateTrainingPlan(mockEmployee, 'sk-bad')).rejects.toThrow('Invalid API key');
  });

  it('throws on 429 rate limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limit exceeded' } }),
    } as Response);

    await expect(generateTrainingPlan(mockEmployee, 'sk-ant-test')).rejects.toThrow('Rate limit reached');
  });

  it('throws on 500 server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(generateTrainingPlan(mockEmployee, 'sk-ant-test')).rejects.toThrow('temporarily unavailable');
  });

  it('throws on malformed JSON response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: 'not valid json at all' }],
      }),
    } as Response);

    await expect(generateTrainingPlan(mockEmployee, 'sk-ant-test')).rejects.toThrow();
  });

  it('handles response wrapped in markdown code fences', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '```json\n' + JSON.stringify(mockPlanResponse) + '\n```' }],
      }),
    } as Response);

    const plan = await generateTrainingPlan(mockEmployee, 'sk-ant-test');
    expect(plan.summary).toBe('Alice needs improvement');
  });

  it('enforces platform diversity — replaces duplicates', async () => {
    const duplicatePlan = {
      ...mockPlanResponse,
      training_plan: [
        {
          area: 'Leadership',
          current_score: 45,
          target_score: 70,
          courses: [
            { title: 'A', platform: 'youtube', duration: '1h', level: 'Beginner', description: 'x', search_query: 'a' },
            { title: 'B', platform: 'youtube', duration: '1h', level: 'Beginner', description: 'x', search_query: 'b' },
          ],
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(duplicatePlan) }],
      }),
    } as Response);

    const plan = await generateTrainingPlan(mockEmployee, 'sk-ant-test');
    const platforms = plan.training_plan[0].courses.map(c => c.platform);
    expect(new Set(platforms).size).toBe(platforms.length);
  });

  it('replaces unknown platforms with linkedin', async () => {
    const badPlatformPlan = {
      ...mockPlanResponse,
      training_plan: [
        {
          area: 'Leadership',
          current_score: 45,
          target_score: 70,
          courses: [
            { title: 'A', platform: 'unknownplatform', duration: '1h', level: 'Beginner', description: 'x', search_query: 'a' },
          ],
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify(badPlatformPlan) }],
      }),
    } as Response);

    const plan = await generateTrainingPlan(mockEmployee, 'sk-ant-test');
    expect(plan.training_plan[0].courses[0].platform).not.toBe('unknownplatform');
  });

  it('handles API error in response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { message: 'Overloaded' },
      }),
    } as Response);

    await expect(generateTrainingPlan(mockEmployee, 'sk-ant-test')).rejects.toThrow('Overloaded');
  });
});
