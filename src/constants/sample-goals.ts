import type { Goal } from '../types/goal';

const NOW = new Date().toISOString();

function goal(
  id: string, employeeName: string, title: string, description: string,
  weight: number, category: 'Personal goals' | 'Department/Service goals',
  routeStep: 'Goal Setting' | 'Mid-Year Discussion' | 'Year-End Review' = 'Goal Setting',
  rating: 'Unrated' | 'Meets' | 'Exceeds' | 'Outstanding' | 'Below' = 'Unrated',
  progress = 0,
): Goal {
  return {
    id, employeeName, documentId: `doc-${employeeName.replace(/\s/g, '-').toLowerCase()}`,
    category, type: 'user', title, description, weight,
    expectedResult: `Achieve target metrics for: ${title}`,
    routeStep, rating, achievementPercent: rating !== 'Unrated' ? progress : 0,
    progress, status: rating !== 'Unrated' ? 'completed' : routeStep === 'Mid-Year Discussion' ? 'in_progress' : 'not_started',
    createdAt: NOW, updatedAt: NOW,
  };
}

export const SAMPLE_GOALS: Goal[] = [
  // ─── Alice Wong (Engineering, score: 82) — weights: 30+25+25+20 = 100 ──
  goal('g-alice-1', 'Alice Wong', 'Code Quality Excellence', 'Maintain >95% test coverage and zero critical bugs in production', 30, 'Personal goals', 'Mid-Year Discussion', 'Exceeds', 85),
  goal('g-alice-2', 'Alice Wong', 'Architecture Leadership', 'Lead microservices migration for 3 core modules', 25, 'Personal goals', 'Mid-Year Discussion', 'Meets', 70),
  goal('g-alice-3', 'Alice Wong', 'Team Mentoring', 'Mentor 2 junior developers through onboarding program', 25, 'Department/Service goals', 'Mid-Year Discussion', 'Meets', 65),
  goal('g-alice-4', 'Alice Wong', 'Safety & Wellbeing', 'Complete workstation assessment and participate in team wellbeing activities', 20, 'Department/Service goals', 'Goal Setting'),

  // ─── Bob Martinez (Engineering, score: 68) — weights: 35+30+20+15 = 100 ──
  goal('g-bob-1', 'Bob Martinez', 'API Performance', 'Reduce API response times by 40% across all endpoints', 35, 'Personal goals', 'Mid-Year Discussion', 'Unrated', 40),
  goal('g-bob-2', 'Bob Martinez', 'Backend Testing', 'Achieve 80% unit test coverage for all backend services', 30, 'Personal goals', 'Goal Setting'),
  goal('g-bob-3', 'Bob Martinez', 'Documentation Standards', 'Create and maintain API documentation for all services', 20, 'Department/Service goals', 'Goal Setting'),
  goal('g-bob-4', 'Bob Martinez', 'Personal Leadership', 'Demonstrate constructive collaboration and accept feedback', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Carol Nguyen (Engineering, score: 74) — weights: 30+30+25+15 = 100 ──
  goal('g-carol-1', 'Carol Nguyen', 'UI Component Library', 'Build shared component library used by 3+ product teams', 30, 'Personal goals', 'Mid-Year Discussion', 'Meets', 70),
  goal('g-carol-2', 'Carol Nguyen', 'Accessibility Compliance', 'Achieve WCAG 2.1 AA compliance across all user-facing pages', 30, 'Personal goals', 'Mid-Year Discussion', 'Unrated', 45),
  goal('g-carol-3', 'Carol Nguyen', 'Cross-Team Collaboration', 'Partner with design team on 2 major feature redesigns', 25, 'Department/Service goals', 'Goal Setting'),
  goal('g-carol-4', 'Carol Nguyen', 'Safety & Wellbeing', 'Complete workstation assessment and hazard identification', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Dan Johnson (Engineering, score: 56) — weights: 35+30+20+15 = 100 ──
  goal('g-dan-1', 'Dan Johnson', 'Infrastructure Reliability', 'Achieve 99.9% uptime SLA for production infrastructure', 35, 'Personal goals', 'Mid-Year Discussion', 'Below', 35),
  goal('g-dan-2', 'Dan Johnson', 'CI/CD Pipeline', 'Reduce deployment time from 45min to under 15min', 30, 'Personal goals', 'Goal Setting'),
  goal('g-dan-3', 'Dan Johnson', 'Incident Response', 'Establish runbooks for top 10 incident categories', 20, 'Department/Service goals', 'Goal Setting'),
  goal('g-dan-4', 'Dan Johnson', 'Personal Leadership', 'Communicate openly and collaborate within and across teams', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Eva Schmidt (Engineering, score: 71) — weights: 30+25+25+20 = 100 ──
  goal('g-eva-1', 'Eva Schmidt', 'Test Automation Framework', 'Build E2E test suite covering 80% of critical user journeys', 30, 'Personal goals', 'Mid-Year Discussion', 'Meets', 72),
  goal('g-eva-2', 'Eva Schmidt', 'Quality Metrics Dashboard', 'Create real-time quality metrics dashboard for engineering', 25, 'Personal goals', 'Goal Setting'),
  goal('g-eva-3', 'Eva Schmidt', 'Release Process', 'Reduce regression testing cycle from 3 days to 1 day', 25, 'Department/Service goals', 'Mid-Year Discussion', 'Unrated', 50),
  goal('g-eva-4', 'Eva Schmidt', 'Safety & Wellbeing', 'Participate in team wellbeing activities and complete SHE notification', 20, 'Department/Service goals', 'Goal Setting'),

  // ─── Frank Lee (Marketing, score: 77) — weights: 30+30+25+15 = 100 ──
  goal('g-frank-1', 'Frank Lee', 'Content Strategy Overhaul', 'Increase organic traffic by 50% through content optimization', 30, 'Personal goals', 'Mid-Year Discussion', 'Exceeds', 88),
  goal('g-frank-2', 'Frank Lee', 'Thought Leadership', 'Publish 12 industry articles and 4 whitepapers', 30, 'Personal goals', 'Mid-Year Discussion', 'Meets', 70),
  goal('g-frank-3', 'Frank Lee', 'Brand Voice Guidelines', 'Establish and document brand voice guidelines across all channels', 25, 'Department/Service goals', 'Goal Setting'),
  goal('g-frank-4', 'Frank Lee', 'Personal Leadership', 'Interact positively with colleagues and express views constructively', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Grace Taylor (Marketing, score: 63) — weights: 35+25+25+15 = 100 ──
  goal('g-grace-1', 'Grace Taylor', 'Digital Campaign ROI', 'Achieve 3:1 ROI on paid digital campaigns', 35, 'Personal goals', 'Mid-Year Discussion', 'Unrated', 30),
  goal('g-grace-2', 'Grace Taylor', 'Marketing Automation', 'Implement automated nurture campaigns for 5 customer segments', 25, 'Personal goals', 'Goal Setting'),
  goal('g-grace-3', 'Grace Taylor', 'Analytics Reporting', 'Deliver monthly marketing performance reports to leadership', 25, 'Department/Service goals', 'Mid-Year Discussion', 'Meets', 65),
  goal('g-grace-4', 'Grace Taylor', 'Safety & Wellbeing', 'Complete psychosocial risk assessment and wellbeing activities', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Henry Brown (Marketing, score: 85) — weights: 30+30+20+20 = 100 ──
  goal('g-henry-1', 'Henry Brown', 'Brand Awareness Growth', 'Increase brand awareness score by 20% in target markets', 30, 'Personal goals', 'Mid-Year Discussion', 'Outstanding', 95),
  goal('g-henry-2', 'Henry Brown', 'Product Launch Strategy', 'Successfully launch 3 new products with >90% campaign effectiveness', 30, 'Personal goals', 'Mid-Year Discussion', 'Exceeds', 82),
  goal('g-henry-3', 'Henry Brown', 'Cross-Functional Alignment', 'Align marketing strategy with sales and product roadmaps quarterly', 20, 'Department/Service goals', 'Mid-Year Discussion', 'Meets', 70),
  goal('g-henry-4', 'Henry Brown', 'Personal Leadership', 'Lead by example, mentor team members, communicate openly', 20, 'Department/Service goals', 'Goal Setting'),

  // ─── Iris Davis (Marketing, score: 59) — weights: 35+25+25+15 = 100 ──
  goal('g-iris-1', 'Iris Davis', 'Social Engagement Growth', 'Grow social media engagement by 60% across all platforms', 35, 'Personal goals', 'Mid-Year Discussion', 'Below', 38),
  goal('g-iris-2', 'Iris Davis', 'Influencer Program', 'Launch and manage micro-influencer program with 20 partners', 25, 'Personal goals', 'Goal Setting'),
  goal('g-iris-3', 'Iris Davis', 'Community Management', 'Achieve <2hr average response time on social channels', 25, 'Department/Service goals', 'Goal Setting'),
  goal('g-iris-4', 'Iris Davis', 'Personal Leadership', 'Accept feedback and take action, understand role in team', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Jack Wilson (Operations, score: 72) — weights: 30+30+25+15 = 100 ──
  goal('g-jack-1', 'Jack Wilson', 'Process Optimization', 'Reduce operational waste by 25% through lean methodology', 30, 'Personal goals', 'Mid-Year Discussion', 'Meets', 68),
  goal('g-jack-2', 'Jack Wilson', 'Data-Driven Decisions', 'Build operations analytics dashboard with 15 KPIs', 30, 'Personal goals', 'Goal Setting'),
  goal('g-jack-3', 'Jack Wilson', 'Vendor Management', 'Negotiate 10% cost reduction with top 5 vendors', 25, 'Department/Service goals', 'Mid-Year Discussion', 'Unrated', 40),
  goal('g-jack-4', 'Jack Wilson', 'Safety & Wellbeing', 'Complete workstation inspection and hazard notifications', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Karen Moore (Operations, score: 81) — weights: 30+25+25+20 = 100 ──
  goal('g-karen-1', 'Karen Moore', 'Supply Chain Efficiency', 'Reduce order-to-delivery time by 30%', 30, 'Personal goals', 'Mid-Year Discussion', 'Exceeds', 85),
  goal('g-karen-2', 'Karen Moore', 'Inventory Optimization', 'Maintain optimal stock levels with <2% stockout rate', 25, 'Personal goals', 'Mid-Year Discussion', 'Meets', 72),
  goal('g-karen-3', 'Karen Moore', 'Team Development', 'Develop succession plan and cross-train 3 team members', 25, 'Department/Service goals', 'Goal Setting'),
  goal('g-karen-4', 'Karen Moore', 'Personal Leadership', 'Mentor team, communicate openly, collaborate across departments', 20, 'Department/Service goals', 'Goal Setting'),

  // ─── Leo Garcia (Operations, score: 54) — weights: 35+30+20+15 = 100 ──
  goal('g-leo-1', 'Leo Garcia', 'Logistics Efficiency', 'Improve on-time delivery rate from 85% to 95%', 35, 'Personal goals', 'Mid-Year Discussion', 'Below', 40),
  goal('g-leo-2', 'Leo Garcia', 'Route Optimization', 'Implement route optimization reducing fuel costs by 15%', 30, 'Personal goals', 'Goal Setting'),
  goal('g-leo-3', 'Leo Garcia', 'Compliance Training', 'Complete all mandatory compliance certifications by Q3', 20, 'Department/Service goals', 'Mid-Year Discussion', 'Meets', 70),
  goal('g-leo-4', 'Leo Garcia', 'Personal Leadership', 'Accept feedback, participate in team discussions constructively', 15, 'Department/Service goals', 'Goal Setting'),

  // ─── Mia Anderson (Operations, score: 66) — weights: 30+25+25+20 = 100 ──
  goal('g-mia-1', 'Mia Anderson', 'Quality Standards', 'Achieve ISO 9001 certification renewal with zero non-conformances', 30, 'Personal goals', 'Mid-Year Discussion', 'Meets', 70),
  goal('g-mia-2', 'Mia Anderson', 'Defect Reduction', 'Reduce product defect rate by 40% through improved QC processes', 25, 'Personal goals', 'Goal Setting'),
  goal('g-mia-3', 'Mia Anderson', 'Audit Readiness', 'Maintain continuous audit readiness across all departments', 25, 'Department/Service goals', 'Mid-Year Discussion', 'Unrated', 45),
  goal('g-mia-4', 'Mia Anderson', 'Safety & Wellbeing', 'Lead quality-focused safety initiatives and SHE notifications', 20, 'Department/Service goals', 'Goal Setting'),

  // ─── Noah Thomas (Operations, score: 73) — weights: 30+25+25+20 = 100 ──
  goal('g-noah-1', 'Noah Thomas', 'Facilities Modernization', 'Complete office renovation project on time and 5% under budget', 30, 'Personal goals', 'Mid-Year Discussion', 'Meets', 68),
  goal('g-noah-2', 'Noah Thomas', 'Energy Efficiency', 'Reduce building energy consumption by 20% through smart systems', 25, 'Personal goals', 'Goal Setting'),
  goal('g-noah-3', 'Noah Thomas', 'Emergency Preparedness', 'Conduct quarterly emergency drills with >95% staff participation', 25, 'Department/Service goals', 'Mid-Year Discussion', 'Exceeds', 80),
  goal('g-noah-4', 'Noah Thomas', 'Personal Leadership', 'Communicate openly, collaborate across teams, mentor new staff', 20, 'Department/Service goals', 'Goal Setting'),
];
