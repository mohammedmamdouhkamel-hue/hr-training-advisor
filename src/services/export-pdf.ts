import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Employee } from '../types/employee';
import type { TrainingPlan } from '../types/training-plan';
import { PLATFORMS } from '../constants/platforms';

function addBrandedHeader(doc: jsPDF): number {
  // Navy header bar
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');

  // App name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('HR Training Advisor', 14, 18);

  // Subtitle
  doc.setFontSize(8);
  doc.setTextColor(96, 165, 250); // #60A5FA
  doc.setFont('helvetica', 'normal');
  doc.text('Powered by AI', doc.internal.pageSize.getWidth() - 14, 18, { align: 'right' });

  return 36; // y position after header
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // NAVY
  doc.text(title, 14, y);

  // Underline
  doc.setDrawColor(59, 130, 246); // BLUE
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, 80, y + 2);

  return y + 8;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return addBrandedHeader(doc);
  }
  return y;
}

export function exportPlanToPDF(employee: Employee, plan: TrainingPlan): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = addBrandedHeader(doc);

  // --- Employee Info Section ---
  y = addSectionTitle(doc, 'Employee Information', y);

  const infoRows = [
    ['Name', employee.name],
    ['Role', employee.role],
    ['Department', employee.department],
    ['Overall Score', `${employee.score}/100`],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 40 },
      1: { textColor: [100, 116, 139] },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // --- Summary Section ---
  y = checkPageBreak(doc, y, 30);
  y = addSectionTitle(doc, 'Summary', y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // #334155
  const summaryLines = doc.splitTextToSize(plan.summary, pageWidth - 28);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 4.5 + 6;

  // --- Priority Areas ---
  y = checkPageBreak(doc, y, 20);
  y = addSectionTitle(doc, 'Priority Areas', y);

  plan.priority_areas?.forEach((area, i) => {
    y = checkPageBreak(doc, y, 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    // Numbered bullet
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${i + 1}.`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(area, 22, y);
    y += 6;
  });

  y += 4;

  // --- Training Plan Table ---
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, 'Training Plan', y);

  const trainingRows: string[][] = [];
  plan.training_plan?.forEach((area) => {
    area.courses?.forEach((course) => {
      const platformName = PLATFORMS[course.platform]?.name ?? course.platform;
      trainingRows.push([
        area.area,
        String(area.current_score),
        String(area.target_score),
        course.title,
        platformName,
        course.duration,
        course.level,
      ]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [['Area', 'Current', 'Target', 'Course', 'Platform', 'Duration', 'Level']],
    body: trainingRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 45 },
      4: { cellWidth: 28 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // --- Milestones Timeline Table ---
  y = checkPageBreak(doc, y, 30);
  y = addSectionTitle(doc, 'Milestones', y);

  const milestoneRows = plan.milestones?.map((m) => [m.week, m.goal]) ?? [];

  autoTable(doc, {
    startY: y,
    head: [['Timeline', 'Goal']],
    body: milestoneRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // --- Expected Improvement Footer ---
  if (plan.expected_improvement) {
    y = checkPageBreak(doc, y, 20);
    doc.setFillColor(241, 245, 249); // LIGHT_GRAY
    doc.roundedRect(14, y, pageWidth - 28, 14, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Expected Improvement:', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246); // BLUE
    const impText = doc.splitTextToSize(plan.expected_improvement, pageWidth - 80);
    doc.text(impText, 62, y + 6);
  }

  // --- Footer with generation date ---
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()} by HR Training Advisor`, 14, footerY);

  // Save
  const safeName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Training_Plan_${safeName}.pdf`);
}

export function exportAllPlansToPDF(
  employees: Employee[],
  plans: Record<string, TrainingPlan>,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let isFirst = true;

  employees.forEach((employee) => {
    const plan = plans[employee.name];
    if (!plan) return;

    if (!isFirst) {
      doc.addPage();
    }
    isFirst = false;

    let y = addBrandedHeader(doc);

    // --- Employee Info Section ---
    y = addSectionTitle(doc, 'Employee Information', y);

    const infoRows = [
      ['Name', employee.name],
      ['Role', employee.role],
      ['Department', employee.department],
      ['Overall Score', `${employee.score}/100`],
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: infoRows,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 40 },
        1: { textColor: [100, 116, 139] },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // --- Summary ---
    y = checkPageBreak(doc, y, 30);
    y = addSectionTitle(doc, 'Summary', y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(plan.summary, pageWidth - 28);
    doc.text(summaryLines, 14, y);
    y += summaryLines.length * 4.5 + 6;

    // --- Priority Areas ---
    y = checkPageBreak(doc, y, 20);
    y = addSectionTitle(doc, 'Priority Areas', y);

    plan.priority_areas?.forEach((area, i) => {
      y = checkPageBreak(doc, y, 8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${i + 1}.`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(area, 22, y);
      y += 6;
    });

    y += 4;

    // --- Training Plan Table ---
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, 'Training Plan', y);

    const trainingRows: string[][] = [];
    plan.training_plan?.forEach((area) => {
      area.courses?.forEach((course) => {
        const platformName = PLATFORMS[course.platform]?.name ?? course.platform;
        trainingRows.push([
          area.area,
          String(area.current_score),
          String(area.target_score),
          course.title,
          platformName,
          course.duration,
          course.level,
        ]);
      });
    });

    autoTable(doc, {
      startY: y,
      head: [['Area', 'Current', 'Target', 'Course', 'Platform', 'Duration', 'Level']],
      body: trainingRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 45 },
        4: { cellWidth: 28 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
      },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // --- Milestones Table ---
    y = checkPageBreak(doc, y, 30);
    y = addSectionTitle(doc, 'Milestones', y);

    const milestoneRows = plan.milestones?.map((m) => [m.week, m.goal]) ?? [];

    autoTable(doc, {
      startY: y,
      head: [['Timeline', 'Goal']],
      body: milestoneRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // --- Expected Improvement ---
    if (plan.expected_improvement) {
      y = checkPageBreak(doc, y, 20);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, y, pageWidth - 28, 14, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Expected Improvement:', 18, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(59, 130, 246);
      const impText = doc.splitTextToSize(plan.expected_improvement, pageWidth - 80);
      doc.text(impText, 62, y + 6);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()} by HR Training Advisor`, 14, footerY);
  });

  doc.save('All_Training_Plans.pdf');
}
