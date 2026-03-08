import type { Employee } from '../types/employee';
import type { TrainingPlan } from '../types/training-plan';
import type { PlatformKey } from '../types/platform';
import { PLATFORM_KEYS } from '../constants/platforms';
import { getApiErrorMessage, getNetworkErrorMessage } from '../utils/error-messages';

export async function generateTrainingPlan(employee: Employee, apiKey: string): Promise<TrainingPlan> {
  const weakAreas = Object.entries(employee.competencies)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  const platformPool: PlatformKey[] = [...PLATFORM_KEYS];
  let idx = 0;
  const next = () => platformPool[(idx++) % platformPool.length];
  const assigned = weakAreas.map(() => [next(), next()]);
  const assignments = weakAreas.map(([area], i) =>
    `- "${area}": course 1 → platform="${assigned[i][0]}", course 2 → platform="${assigned[i][1]}"`
  ).join('\n');

  const prompt = `You are an expert HR L&D advisor. Create a personalised 90-day training plan.

Employee: ${employee.name}
Role: ${employee.role}
Department: ${employee.department}
Overall Score: ${employee.score}/100

Competency Scores:
${Object.entries(employee.competencies).map(([k, v]) => `- ${k}: ${v}/100`).join('\n')}

Weakest areas:
${weakAreas.map(([k, v]) => `- ${k}: ${v}/100`).join('\n')}

MANDATORY PLATFORM ASSIGNMENTS (follow exactly, no exceptions):
${assignments}
- NEVER repeat a platform across the entire plan
- Use all 6 platforms: youtube, coursera, udemy, pluralsight, aim, linkedin

Respond ONLY with raw JSON (no markdown, no backticks, no preamble):
{
  "summary": "2-3 sentence personalised assessment",
  "priority_areas": ["area1", "area2", "area3"],
  "training_plan": [
    {
      "area": "competency name",
      "current_score": 0,
      "target_score": 0,
      "courses": [
        {
          "title": "specific real course title",
          "platform": "platform_as_assigned",
          "duration": "X hours",
          "level": "Beginner|Intermediate|Advanced",
          "description": "one sentence on why this addresses the gap",
          "search_query": "search query to find this on the platform"
        }
      ]
    }
  ],
  "milestones": [
    {"week": "Week 1-2",  "goal": "specific measurable goal"},
    {"week": "Week 3-6",  "goal": "specific measurable goal"},
    {"week": "Week 7-12", "goal": "specific measurable goal"}
  ],
  "expected_improvement": "Expected score improvement after 90 days"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as Record<string, unknown>));
    const errObj = err as { error?: { message?: string } };
    throw new Error(getApiErrorMessage(res.status, errObj?.error?.message));
  }

  const data = await res.json() as {
    error?: { message: string };
    content?: { text?: string }[];
  };
  if (data.error) throw new Error(data.error.message);

  let plan: TrainingPlan;
  try {
    const text  = data.content?.map(b => b.text || '').join('') || '';
    const clean = text.replace(/^```(?:json)?\s*|\s*```$/gm, '').trim();
    plan = JSON.parse(clean);
  } catch (e) {
    throw new Error(getNetworkErrorMessage(e));
  }

  // Enforce platform diversity as safety net
  const all: PlatformKey[] = [...PLATFORM_KEYS];
  const used = new Set<string>();
  plan.training_plan?.forEach(area => {
    area.courses?.forEach(course => {
      if (!all.includes(course.platform as PlatformKey)) course.platform = 'linkedin';
      if (used.has(course.platform)) {
        const alt = all.find(p => !used.has(p));
        if (alt) course.platform = alt;
      }
      used.add(course.platform);
    });
  });

  return plan;
}
