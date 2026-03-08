import * as XLSX from 'xlsx';
import type { Employee } from '../types/employee';
import type { TrainingPlan } from '../types/training-plan';
import { PLATFORMS } from '../constants/platforms';

function createOverviewSheet(employee: Employee, plan: TrainingPlan): XLSX.WorkSheet {
  const rows: (string | number)[][] = [];

  // Employee Info header
  rows.push(['HR Training Advisor - Employee Training Plan']);
  rows.push([]);
  rows.push(['Employee Information']);
  rows.push(['Name', employee.name]);
  rows.push(['Role', employee.role]);
  rows.push(['Department', employee.department]);
  rows.push(['Overall Score', employee.score]);
  rows.push([]);

  // Summary
  rows.push(['Summary']);
  rows.push([plan.summary]);
  rows.push([]);

  // Priority Areas
  rows.push(['Priority Areas']);
  plan.priority_areas?.forEach((area, i) => {
    rows.push([`${i + 1}. ${area}`]);
  });
  rows.push([]);

  // Competency Scores
  rows.push(['Competency Scores']);
  rows.push(['Competency', 'Score']);
  Object.entries(employee.competencies).forEach(([name, score]) => {
    rows.push([name, score]);
  });
  rows.push([]);

  // Expected Improvement
  if (plan.expected_improvement) {
    rows.push(['Expected Improvement']);
    rows.push([plan.expected_improvement]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [{ wch: 40 }, { wch: 30 }];

  // Merge the title cell across columns
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  return ws;
}

function createTrainingPlanSheet(plan: TrainingPlan): XLSX.WorkSheet {
  const rows: (string | number)[][] = [];

  // Header row
  rows.push([
    'Area',
    'Current Score',
    'Target Score',
    'Course Title',
    'Platform',
    'Duration',
    'Level',
    'Description',
  ]);

  // Data rows
  plan.training_plan?.forEach((area) => {
    area.courses?.forEach((course) => {
      const platformName = PLATFORMS[course.platform]?.name ?? course.platform;
      rows.push([
        area.area,
        area.current_score,
        area.target_score,
        course.title,
        platformName,
        course.duration,
        course.level,
        course.description,
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Area
    { wch: 14 }, // Current Score
    { wch: 14 }, // Target Score
    { wch: 35 }, // Course Title
    { wch: 20 }, // Platform
    { wch: 14 }, // Duration
    { wch: 14 }, // Level
    { wch: 50 }, // Description
  ];

  return ws;
}

function createMilestonesSheet(plan: TrainingPlan): XLSX.WorkSheet {
  const rows: string[][] = [];

  // Header row
  rows.push(['Week', 'Goal']);

  // Data rows
  plan.milestones?.forEach((m) => {
    rows.push([m.week, m.goal]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [{ wch: 20 }, { wch: 60 }];

  return ws;
}

export function exportPlanToExcel(employee: Employee, plan: TrainingPlan): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const overviewSheet = createOverviewSheet(employee, plan);
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

  // Sheet 2: Training Plan
  const trainingSheet = createTrainingPlanSheet(plan);
  XLSX.utils.book_append_sheet(wb, trainingSheet, 'Training Plan');

  // Sheet 3: Milestones
  const milestonesSheet = createMilestonesSheet(plan);
  XLSX.utils.book_append_sheet(wb, milestonesSheet, 'Milestones');

  // Save
  const safeName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Training_Plan_${safeName}.xlsx`);
}

export function exportAllPlansToExcel(
  employees: Employee[],
  plans: Record<string, TrainingPlan>,
): void {
  const wb = XLSX.utils.book_new();

  employees.forEach((employee) => {
    const plan = plans[employee.name];
    if (!plan) return;

    // Sanitize and truncate sheet name (Excel max 31 chars)
    const sheetName = employee.name.replace(/[\\/*?:\[\]]/g, '').substring(0, 31);

    const rows: (string | number)[][] = [];

    // Employee Info
    rows.push(['HR Training Advisor - Training Plan']);
    rows.push([]);
    rows.push(['Name', employee.name]);
    rows.push(['Role', employee.role]);
    rows.push(['Department', employee.department]);
    rows.push(['Overall Score', employee.score]);
    rows.push([]);

    // Summary
    rows.push(['Summary']);
    rows.push([plan.summary]);
    rows.push([]);

    // Priority Areas
    rows.push(['Priority Areas']);
    plan.priority_areas?.forEach((area, i) => {
      rows.push([`${i + 1}. ${area}`]);
    });
    rows.push([]);

    // Training Plan
    rows.push([
      'Area',
      'Current Score',
      'Target Score',
      'Course Title',
      'Platform',
      'Duration',
      'Level',
      'Description',
    ]);
    plan.training_plan?.forEach((area) => {
      area.courses?.forEach((course) => {
        const platformName = PLATFORMS[course.platform]?.name ?? course.platform;
        rows.push([
          area.area,
          area.current_score,
          area.target_score,
          course.title,
          platformName,
          course.duration,
          course.level,
          course.description,
        ]);
      });
    });
    rows.push([]);

    // Milestones
    rows.push(['Milestones']);
    rows.push(['Week', 'Goal']);
    plan.milestones?.forEach((m) => {
      rows.push([m.week, m.goal]);
    });
    rows.push([]);

    // Expected Improvement
    if (plan.expected_improvement) {
      rows.push(['Expected Improvement']);
      rows.push([plan.expected_improvement]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 35 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 50 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, 'All_Training_Plans.xlsx');
}
