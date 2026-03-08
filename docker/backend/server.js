import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';

// ── Configuration ──────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS_CAP = 4096;
const BODY_LIMIT = '10kb';
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM || '20', 10);
const CORS_ENABLED = process.env.CORS_ENABLED === 'true';

// ── Express app ────────────────────────────────────

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('combined'));

// Body parsing with size limit
app.use(express.json({ limit: BODY_LIMIT }));

// CORS for development
if (CORS_ENABLED) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMIT_RPM,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a minute.' },
});
app.use('/api/', limiter);

// ── Health check ───────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── POST /api/generate ─────────────────────────────

app.post('/api/generate', async (req, res) => {
  try {
    const { employee, apiKey: clientKey } = req.body || {};

    // Validate employee data is present
    if (!employee || typeof employee !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid "employee" field.' });
    }

    if (!employee.name || !employee.role || !employee.department) {
      return res.status(400).json({ error: 'Employee must have name, role, and department.' });
    }

    if (typeof employee.score !== 'number' || employee.score < 0 || employee.score > 100) {
      return res.status(400).json({ error: 'Employee score must be a number between 0 and 100.' });
    }

    if (!employee.competencies || typeof employee.competencies !== 'object') {
      return res.status(400).json({ error: 'Employee must have competencies object.' });
    }

    // Determine API key: env var takes priority, fallback to client-provided
    const resolvedKey = ANTHROPIC_API_KEY || clientKey;
    if (!resolvedKey) {
      return res.status(401).json({
        error: 'No API key configured. Set ANTHROPIC_API_KEY or provide apiKey in request body.',
      });
    }

    // Build the prompt (mirrors frontend logic)
    const weakAreas = Object.entries(employee.competencies)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);

    const platformPool = ['youtube', 'coursera', 'udemy', 'pluralsight', 'aim', 'linkedin'];
    let idx = 0;
    const next = () => platformPool[idx++ % platformPool.length];
    const assigned = weakAreas.map(() => [next(), next()]);
    const assignments = weakAreas
      .map(([area], i) =>
        `- "${area}": course 1 -> platform="${assigned[i][0]}", course 2 -> platform="${assigned[i][1]}"`
      )
      .join('\n');

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

    // Forward to Anthropic API
    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': resolvedKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: Math.min(req.body.max_tokens || 1500, MAX_TOKENS_CAP),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    // Stream the status and body back to the client
    const responseBody = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json(responseBody);
    }

    return res.json(responseBody);
  } catch (err) {
    console.error('[/api/generate] Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── 404 fallback ───────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ── Start server ───────────────────────────────────

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[backend] Listening on port ${PORT}`);
  console.log(`[backend] API key: ${ANTHROPIC_API_KEY ? 'configured (env)' : 'not set (will use client key)'}`);
  console.log(`[backend] Rate limit: ${RATE_LIMIT_RPM} req/min/IP`);
  console.log(`[backend] CORS: ${CORS_ENABLED ? 'enabled' : 'disabled'}`);
});

// ── Graceful shutdown ──────────────────────────────

function shutdown(signal) {
  console.log(`\n[backend] Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('[backend] HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[backend] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
