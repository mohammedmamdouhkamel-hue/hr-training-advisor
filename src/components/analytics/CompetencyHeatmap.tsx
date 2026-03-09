import type { Employee } from '../../types/employee';

interface CompetencyHeatmapProps {
  employees: Employee[];
}

interface CompetencyRow {
  name: string;
  avgScore: number;
  count: number;
}

function getCellColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 65) return '#D97706';
  return '#DC2626';
}

function getCellBg(score: number): string {
  if (score >= 80) return 'rgba(5, 150, 105, 0.12)';
  if (score >= 65) return 'rgba(217, 119, 6, 0.12)';
  return 'rgba(220, 38, 38, 0.12)';
}

export default function CompetencyHeatmap({ employees }: CompetencyHeatmapProps) {
  const competencyMap = new Map<string, { total: number; count: number }>();

  for (const emp of employees) {
    for (const [name, score] of Object.entries(emp.competencies)) {
      const existing = competencyMap.get(name) ?? { total: 0, count: 0 };
      existing.total += score;
      existing.count += 1;
      competencyMap.set(name, existing);
    }
  }

  let rows: CompetencyRow[] = Array.from(competencyMap.entries()).map(
    ([name, { total, count }]) => ({
      name,
      avgScore: Math.round((total / count) * 10) / 10,
      count,
    }),
  );

  // Sort by frequency descending, then limit to top 10 if many
  rows.sort((a, b) => b.count - a.count);
  if (rows.length > 10) {
    rows = rows.slice(0, 10);
  }

  // Re-sort by average score descending for display
  rows.sort((a, b) => b.avgScore - a.avgScore);

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: 10,
        border: '1px solid var(--surface-border)',
        padding: 24,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--color-primary-950)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Competency Overview
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: '1px solid var(--surface-border)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Competency
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '8px 12px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: '1px solid var(--surface-border)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Avg Score
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '8px 12px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: '1px solid var(--surface-border)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Employees
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: '1px solid var(--surface-border)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  width: '40%',
                }}
              >
                Level
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td
                  style={{
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--color-gray-100)',
                  }}
                >
                  {row.name}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--color-gray-100)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      background: getCellBg(row.avgScore),
                      color: getCellColor(row.avgScore),
                      fontWeight: 700,
                      fontSize: 12,
                      padding: '3px 10px',
                      borderRadius: 6,
                      minWidth: 40,
                    }}
                  >
                    {row.avgScore}
                  </span>
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--color-gray-100)',
                  }}
                >
                  {row.count}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--color-gray-100)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: 'var(--color-gray-100)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${row.avgScore}%`,
                          height: '100%',
                          background: getCellColor(row.avgScore),
                          borderRadius: 4,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  No competency data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
