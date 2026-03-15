// src/components/dashboard/ActivityFeed.tsx
import React, { useInsertionEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Severity = 'info' | 'warning' | 'critical';
type IconType = 'training' | 'alert' | 'compliance' | 'system' | 'team';

interface ActivityItem {
  id: string;
  icon: IconType;
  description: string;
  timestamp: number;
  roles: ReadonlyArray<UserRole>;
  severity?: Severity;
}

/* ------------------------------------------------------------------ */
/*  Severity sort priority                                             */
/* ------------------------------------------------------------------ */
const SEVERITY_PRIORITY: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
} as const;

/* ------------------------------------------------------------------ */
/*  Mock Data Factory                                                  */
/* ------------------------------------------------------------------ */
function buildMockActivities(): ActivityItem[] {
  const now = Date.now();
  const mins = (n: number): number => n * 60_000;
  const hrs = (n: number): number => n * 3_600_000;
  const days = (n: number): number => n * 86_400_000;

  return [
    // ── Visible to ALL roles ──
    {
      id: 'act-01',
      roles: ['employee', 'manager', 'admin', 'hr_coordinator'],
      severity: 'info',
      icon: 'training',
      description: 'Completed Infection Control module',
      timestamp: now - mins(14),
    },
    {
      id: 'act-03',
      roles: ['employee', 'manager', 'admin', 'hr_coordinator'],
      severity: 'info',
      icon: 'training',
      description: 'CPR refresher scheduled for next week',
      timestamp: now - hrs(2),
    },
    {
      id: 'act-05',
      roles: ['employee', 'manager', 'admin', 'hr_coordinator'],
      severity: 'info',
      icon: 'training',
      description: 'Infection Control assessment due in 3 days',
      timestamp: now - hrs(8),
    },
    {
      id: 'act-09',
      roles: ['employee', 'manager', 'admin', 'hr_coordinator'],
      severity: 'info',
      icon: 'system',
      description: 'System maintenance scheduled for Sunday',
      timestamp: now - days(3),
    },
    // ── Manager + Admin + HR oversight ──
    {
      id: 'act-02',
      roles: ['manager', 'admin', 'hr_coordinator'],
      severity: 'critical',
      icon: 'alert',
      description: 'Team member overdue: Manual Handling — immediate follow-up required',
      timestamp: now - mins(47),
    },
    {
      id: 'act-06',
      roles: ['manager', 'admin', 'hr_coordinator'],
      severity: 'warning',
      icon: 'team',
      description: '3 staff overdue for CPR recertification',
      timestamp: now - days(1),
    },
    // ── Admin + HR only ──
    {
      id: 'act-07',
      roles: ['admin', 'hr_coordinator'],
      severity: 'critical',
      icon: 'compliance',
      description: 'NSQHS Standard 1 gap identified — immediate escalation required',
      timestamp: now - days(1),
    },
    {
      id: 'act-04',
      roles: ['admin', 'hr_coordinator'],
      severity: 'warning',
      icon: 'compliance',
      description: 'Workplace Safety audit report generated',
      timestamp: now - hrs(5),
    },
    {
      id: 'act-10',
      roles: ['admin', 'hr_coordinator'],
      severity: 'warning',
      icon: 'compliance',
      description: 'Quarterly Workplace Safety compliance review due',
      timestamp: now - days(5),
    },
    // ── Employee only ──
    {
      id: 'act-08',
      roles: ['employee'],
      severity: 'info',
      icon: 'training',
      description: 'Manual Handling certificate expiring in 14 days',
      timestamp: now - days(2),
    },
  ];
}

const MOCK_ACTIVITIES: ActivityItem[] = buildMockActivities();

/* ------------------------------------------------------------------ */
/*  relativeTime helper                                                */
/* ------------------------------------------------------------------ */
function relativeTime(ts: number): string {
  const diffSecs = Math.floor(Math.abs(Date.now() - ts) / 1000);
  if (diffSecs < 60) return 'just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return new Date(ts).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Icon resolution                                                    */
/* ------------------------------------------------------------------ */
interface IconConfig {
  emoji: string;
  label: string;
  bg: string;
}

function resolveIconConfig(icon: IconType, severity?: Severity): IconConfig {
  const criticalBg = 'rgba(239,68,68,0.15)';
  const defaultBg = 'rgba(99,102,241,0.12)';
  const bg = severity === 'critical' ? criticalBg : defaultBg;

  switch (icon) {
    case 'training':
      return { emoji: '\uD83D\uDCDA', label: 'Training activity', bg };
    case 'alert':
      return { emoji: '\uD83D\uDEA8', label: 'Alert notification', bg: criticalBg };
    case 'compliance':
      return { emoji: '\u2705', label: 'Compliance activity', bg };
    case 'system':
      return { emoji: '\u2699\uFE0F', label: 'System notification', bg };
    case 'team':
      return { emoji: '\uD83D\uDC65', label: 'Team activity', bg };
    default:
      return { emoji: '\uD83D\uDCCB', label: 'Activity', bg: defaultBg };
  }
}

/* ------------------------------------------------------------------ */
/*  Severity badge                                                     */
/* ------------------------------------------------------------------ */
function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === 'info') return null;

  const badgeStyles: Record<Exclude<Severity, 'info'>, React.CSSProperties> = {
    critical: {
      background: 'rgba(239,68,68,0.15)',
      color: '#FCA5A5',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      padding: '1px 6px',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      flexShrink: 0,
    },
    warning: {
      background: 'rgba(245,158,11,0.12)',
      color: '#FCD34D',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      padding: '1px 6px',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      flexShrink: 0,
    },
  };

  const label = severity === 'critical' ? 'Critical' : 'Warning';

  return (
    <span
      role="status"
      aria-label={`Severity: ${label}`}
      style={badgeStyles[severity]}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  ActivityFeedItem                                                   */
/* ------------------------------------------------------------------ */
interface ActivityFeedItemProps {
  item: ActivityItem;
  isLast: boolean;
}

const ActivityFeedItem = React.memo(function ActivityFeedItem({
  item,
  isLast,
}: ActivityFeedItemProps) {
  const { emoji, label, bg } = resolveIconConfig(item.icon, item.severity);
  const isCritical = item.severity === 'critical';

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        borderLeft: isCritical ? '3px solid rgba(239,68,68,0.6)' : '3px solid transparent',
        animation: 'activityFadeIn 0.3s ease forwards',
        transition: 'background 0.15s ease',
      }}
    >
      <span
        role="img"
        aria-label={label}
        style={{
          width: 36,
          height: 36,
          minWidth: 36,
          borderRadius: '50%',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {emoji}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <p
            style={{
              margin: 0,
              color: '#E2E8F0',
              fontSize: 14,
              lineHeight: 1.4,
              flex: 1,
              minWidth: 0,
            }}
          >
            {item.description}
          </p>
          {item.severity && item.severity !== 'info' && (
            <SeverityBadge severity={item.severity} />
          )}
        </div>

        <time
          dateTime={new Date(item.timestamp).toISOString()}
          style={{
            color: '#64748B',
            fontSize: 12,
            marginTop: 2,
            display: 'block',
          }}
        >
          {relativeTime(item.timestamp)}
        </time>
      </div>
    </li>
  );
});

/* ------------------------------------------------------------------ */
/*  ActivityFeed (main export)                                         */
/* ------------------------------------------------------------------ */
const FEED_MAX_HEIGHT = '400px';
const STYLE_ELEMENT_ID = 'activity-feed-styles';

export function ActivityFeed() {
  const { user } = useAuth();

  // Inject keyframe styles once
  useInsertionEffect(() => {
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ELEMENT_ID;
    el.textContent = `
      @keyframes activityFadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
      @media (prefers-reduced-motion: reduce) {
        #activity-feed-list > li {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(el);
  }, []);

  // Filter by role + sort by severity then timestamp
  const visibleActivities = useMemo<ActivityItem[]>(
    () =>
      MOCK_ACTIVITIES
        .filter((a) => user?.role && a.roles.includes(user.role))
        .sort((a, b) => {
          const pa = SEVERITY_PRIORITY[a.severity ?? 'info'];
          const pb = SEVERITY_PRIORITY[b.severity ?? 'info'];
          if (pa !== pb) return pa - pb;
          return b.timestamp - a.timestamp;
        }),
    [user?.role],
  );

  const isEmpty = visibleActivities.length === 0;

  return (
    <section
      aria-labelledby="activity-feed-title"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2
          id="activity-feed-title"
          style={{ margin: 0, color: '#F1F5F9', fontSize: 16, fontWeight: 600 }}
        >
          Recent Activity
        </h2>
        {!isEmpty && (
          <span
            aria-live="polite"
            aria-label={`${visibleActivities.length} activities`}
            style={{
              background: 'rgba(99,102,241,0.15)',
              color: '#A5B4FC',
              borderRadius: 12,
              fontSize: 12,
              padding: '2px 8px',
              fontWeight: 500,
            }}
          >
            {visibleActivities.length}
          </span>
        )}
      </header>

      {/* Feed list */}
      {isEmpty ? (
        <p
          role="status"
          style={{
            padding: '24px 20px',
            color: '#64748B',
            fontSize: 14,
            textAlign: 'center',
            margin: 0,
          }}
        >
          No activity to display.
        </p>
      ) : (
        <ul
          id="activity-feed-list"
          role="feed"
          aria-label="Recent activity"
          aria-live="polite"
          tabIndex={0}
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: FEED_MAX_HEIGHT,
            overflowY: 'auto',
            outline: 'none',
          }}
        >
          {visibleActivities.map((item, index) => (
            <ActivityFeedItem
              key={item.id}
              item={item}
              isLast={index === visibleActivities.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default ActivityFeed;
