import type { Employee } from '../types/employee';

export function transformRawData(rows: Record<string, string>[]): Employee[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);

  const nameKey  = keys.find(k => /^employee.?name$/i.test(k))  || keys.find(k => /\bname\b/i.test(k) && !/comp/i.test(k)) || keys[0];
  const roleKey  = keys.find(k => /role|title|position/i.test(k)) || keys[1];
  const deptKey  = keys.find(k => /dept|department/i.test(k))   || keys[2];
  const overallKey = keys.find(k => /^overall.?score$/i.test(k)) || keys.find(k => /overall/i.test(k));

  const compNameKeys  = keys.filter(k => /competency \d+ name/i.test(k)).sort();
  const compScoreKeys = keys.filter(k => /competency \d+ score/i.test(k)).sort();
  const isPaired = compNameKeys.length > 0 && compNameKeys.length === compScoreKeys.length;

  const metaRe   = /id|emp|date|year|period|manager|comment|rating|review|overall|competency \d/i;
  const flatKeys = !isPaired
    ? keys.filter(k => k !== nameKey && k !== roleKey && k !== deptKey && k !== overallKey && !metaRe.test(k))
    : [];

  return rows.map(r => {
    const comps: Record<string, number> = {};
    if (isPaired) {
      compNameKeys.forEach((nk, i) => {
        const n = String(r[nk] || '').trim();
        const v = parseFloat(r[compScoreKeys[i]]);
        if (n && !isNaN(v)) comps[n] = v;
      });
    } else {
      flatKeys.forEach(k => { const v = parseFloat(r[k]); if (!isNaN(v)) comps[k] = v; });
    }
    const scores = Object.values(comps);
    let score = overallKey ? parseFloat(r[overallKey]) : NaN;
    if (isNaN(score)) score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      name:         String(r[nameKey] || '').trim() || 'Unknown',
      role:         String(r[roleKey] || '').trim() || 'N/A',
      department:   String(r[deptKey] || '').trim() || 'N/A',
      score,
      competencies: comps,
    };
  }).filter(e => e.name !== 'Unknown' || e.score > 0);
}
