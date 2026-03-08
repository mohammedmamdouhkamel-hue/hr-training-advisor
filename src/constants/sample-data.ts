import type { Employee } from '../types/employee';

export const SAMPLE_DATA: Employee[] = [
  { name: 'Sarah Al-Mansoori', role: 'Software Engineer',  department: 'Technology',      score: 58, competencies: { 'Technical Skills': 55, 'Communication': 72, 'Problem Solving': 60, 'Teamwork': 78, 'Leadership': 45 } },
  { name: 'Omar Khalid',       role: 'Product Manager',    department: 'Product',         score: 62, competencies: { 'Strategic Thinking': 60, 'Communication': 85, 'Data Analysis': 55, 'Stakeholder Mgmt': 70, 'Execution': 58 } },
  { name: 'Fatima Hassan',     role: 'Data Analyst',       department: 'Analytics',       score: 71, competencies: { 'Data Analysis': 82, 'Python/SQL': 65, 'Visualization': 70, 'Communication': 60, 'Business Acumen': 68 } },
  { name: 'Ahmed Nasser',      role: 'UX Designer',        department: 'Design',          score: 54, competencies: { 'UI Design': 60, 'User Research': 50, 'Prototyping': 55, 'Collaboration': 75, 'Design Thinking': 48 } },
  { name: 'Layla Ibrahim',     role: 'HR Specialist',      department: 'Human Resources', score: 67, competencies: { 'Recruitment': 78, 'L&D': 62, 'Compliance': 70, 'HRIS Systems': 55, 'Analytics': 50 } },
];
