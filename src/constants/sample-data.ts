import type { Employee } from '../types/employee';

export const SAMPLE_DATA: Employee[] = [
  // ─── Engineering Team (Manager: Morgan Chen) ────────────────
  { name: 'Alice Wong',      role: 'Senior Engineer',     department: 'Engineering', score: 82, competencies: { 'Technical Skills': 88, 'Communication': 75, 'Problem Solving': 85, 'Teamwork': 80, 'Leadership': 72 } },
  { name: 'Bob Martinez',    role: 'Backend Developer',   department: 'Engineering', score: 68, competencies: { 'Technical Skills': 72, 'Communication': 60, 'Problem Solving': 70, 'Teamwork': 65, 'Leadership': 55 } },
  { name: 'Carol Nguyen',    role: 'Frontend Developer',  department: 'Engineering', score: 74, competencies: { 'Technical Skills': 78, 'Communication': 70, 'Problem Solving': 75, 'Teamwork': 82, 'Leadership': 60 } },
  { name: 'Dan Johnson',     role: 'DevOps Engineer',     department: 'Engineering', score: 56, competencies: { 'Technical Skills': 60, 'Communication': 48, 'Problem Solving': 55, 'Teamwork': 58, 'Leadership': 42 } },
  { name: 'Eva Schmidt',     role: 'QA Engineer',         department: 'Engineering', score: 71, competencies: { 'Technical Skills': 70, 'Communication': 68, 'Problem Solving': 72, 'Teamwork': 78, 'Leadership': 55 } },

  // ─── Marketing Team (Manager: Sarah Patel) ─────────────────
  { name: 'Frank Lee',       role: 'Content Strategist',  department: 'Marketing',   score: 77, competencies: { 'Content Creation': 85, 'SEO/SEM': 72, 'Analytics': 70, 'Communication': 82, 'Strategy': 75 } },
  { name: 'Grace Taylor',    role: 'Digital Marketer',    department: 'Marketing',   score: 63, competencies: { 'Content Creation': 60, 'SEO/SEM': 68, 'Analytics': 55, 'Communication': 70, 'Strategy': 58 } },
  { name: 'Henry Brown',     role: 'Brand Manager',       department: 'Marketing',   score: 85, competencies: { 'Content Creation': 80, 'SEO/SEM': 75, 'Analytics': 78, 'Communication': 90, 'Strategy': 88 } },
  { name: 'Iris Davis',      role: 'Social Media Lead',   department: 'Marketing',   score: 59, competencies: { 'Content Creation': 65, 'SEO/SEM': 50, 'Analytics': 48, 'Communication': 72, 'Strategy': 52 } },

  // ─── Operations Team (Manager: David Kim) ──────────────────
  { name: 'Jack Wilson',     role: 'Operations Analyst',  department: 'Operations',  score: 72, competencies: { 'Process Improvement': 78, 'Data Analysis': 70, 'Project Mgmt': 72, 'Communication': 65, 'Leadership': 60 } },
  { name: 'Karen Moore',     role: 'Supply Chain Lead',   department: 'Operations',  score: 81, competencies: { 'Process Improvement': 85, 'Data Analysis': 75, 'Project Mgmt': 82, 'Communication': 78, 'Leadership': 80 } },
  { name: 'Leo Garcia',      role: 'Logistics Coordinator', department: 'Operations', score: 54, competencies: { 'Process Improvement': 50, 'Data Analysis': 45, 'Project Mgmt': 55, 'Communication': 60, 'Leadership': 42 } },
  { name: 'Mia Anderson',    role: 'Quality Manager',     department: 'Operations',  score: 66, competencies: { 'Process Improvement': 68, 'Data Analysis': 62, 'Project Mgmt': 70, 'Communication': 65, 'Leadership': 58 } },
  { name: 'Noah Thomas',     role: 'Facilities Manager',  department: 'Operations',  score: 73, competencies: { 'Process Improvement': 72, 'Data Analysis': 65, 'Project Mgmt': 78, 'Communication': 70, 'Leadership': 75 } },
];
