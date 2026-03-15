// src/pages/profile/ProfilePage.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Mock data — replace with API calls in production                  */
/* ------------------------------------------------------------------ */
const COMPETENCY_SUMMARY = {
  completed: 12,
  inProgress: 3,
  overdue: 1,
  total: 16,
};

const TEAM_INFO = {
  directReports: 8,
  teamCompliance: 87,
  pendingApprovals: 3,
  teamName: 'Allied Health — Physiotherapy',
};

const ACCOUNT_META = {
  memberSince: '2023-06-15',
  lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hrs ago
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  employee: { bg: 'rgba(99, 102, 241, 0.25)', text: '#818CF8' },
  manager: { bg: 'rgba(251, 191, 36, 0.20)', text: '#FBBF24' },
  admin: { bg: 'rgba(239, 68, 68, 0.20)', text: '#F87171' },
  hr_coordinator: { bg: 'rgba(16, 185, 129, 0.20)', text: '#34D399' },
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '32px 24px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 32,
    color: '#F8FAFC',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 28,
    marginBottom: 24,
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366F1, #818CF8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: '#FFFFFF',
    flexShrink: 0,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#F8FAFC',
    margin: 0,
  },
  email: {
    fontSize: 14,
    color: '#94A3B8',
    margin: '4px 0 8px',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 16,
    marginTop: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: '16px 20px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#818CF8',
    margin: 0,
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  detailValue: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: 500,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const initials = getInitials(user.fullName ?? user.email ?? 'U');
  const role = user.role ?? 'employee';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.employee;
  const department = user.department ?? 'Health Services';
  const roleLabel = role === 'hr_coordinator' ? 'HR Coordinator' : role;

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Profile</h1>

      {/* ---- Identity Card ---- */}
      <div style={styles.glass}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar} aria-hidden="true">
            {initials}
          </div>
          <div>
            <h2 style={styles.fullName}>{user.fullName ?? 'User'}</h2>
            <p style={styles.email}>{user.email}</p>
            <span
              style={{
                ...styles.roleBadge,
                backgroundColor: roleColor.bg,
                color: roleColor.text,
              }}
            >
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Account Details ---- */}
      <div style={styles.glass}>
        <h3 style={styles.sectionTitle}>Account Details</h3>
        <div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Department</span>
            <span style={styles.detailValue}>{department}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Member Since</span>
            <span style={styles.detailValue}>
              {formatDate(ACCOUNT_META.memberSince)}
            </span>
          </div>
          <div style={{ ...styles.detailRow, borderBottom: 'none' }}>
            <span style={styles.detailLabel}>Last Login</span>
            <span style={styles.detailValue}>
              {relativeTime(ACCOUNT_META.lastLogin)}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Employee: Competency Summary ---- */}
      {role === 'employee' && (
        <div style={styles.glass}>
          <h3 style={styles.sectionTitle}>Competency Summary</h3>
          <div style={styles.grid}>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{COMPETENCY_SUMMARY.completed}</p>
              <p style={styles.statLabel}>Completed</p>
            </div>
            <div style={styles.statCard}>
              <p style={{ ...styles.statValue, color: '#FBBF24' }}>
                {COMPETENCY_SUMMARY.inProgress}
              </p>
              <p style={styles.statLabel}>In Progress</p>
            </div>
            <div style={styles.statCard}>
              <p style={{ ...styles.statValue, color: '#F87171' }}>
                {COMPETENCY_SUMMARY.overdue}
              </p>
              <p style={styles.statLabel}>Overdue</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{COMPETENCY_SUMMARY.total}</p>
              <p style={styles.statLabel}>Total Assigned</p>
            </div>
          </div>
          {COMPETENCY_SUMMARY.overdue > 0 && (
            <p
              style={{
                marginTop: 16,
                padding: '10px 16px',
                background: 'rgba(239, 68, 68, 0.10)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 10,
                color: '#F87171',
                fontSize: 13,
              }}
              role="alert"
            >
              You have {COMPETENCY_SUMMARY.overdue} overdue competency
              module{COMPETENCY_SUMMARY.overdue > 1 ? 's' : ''}. Please
              complete as soon as possible.
            </p>
          )}
        </div>
      )}

      {/* ---- Manager: Team Info ---- */}
      {role === 'manager' && (
        <div style={styles.glass}>
          <h3 style={styles.sectionTitle}>Team Information</h3>
          <div style={styles.grid}>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{TEAM_INFO.directReports}</p>
              <p style={styles.statLabel}>Direct Reports</p>
            </div>
            <div style={styles.statCard}>
              <p
                style={{
                  ...styles.statValue,
                  color:
                    TEAM_INFO.teamCompliance >= 90 ? '#34D399' : '#FBBF24',
                }}
              >
                {TEAM_INFO.teamCompliance}%
              </p>
              <p style={styles.statLabel}>Team Compliance</p>
            </div>
            <div style={styles.statCard}>
              <p style={{ ...styles.statValue, color: '#FBBF24' }}>
                {TEAM_INFO.pendingApprovals}
              </p>
              <p style={styles.statLabel}>Pending Approvals</p>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              fontSize: 14,
              color: '#94A3B8',
            }}
          >
            <strong style={{ color: '#E2E8F0' }}>Team:</strong>{' '}
            {TEAM_INFO.teamName}
          </div>
        </div>
      )}

      {/* ---- Admin: Extra Metadata ---- */}
      {role === 'admin' && (
        <div style={styles.glass}>
          <h3 style={styles.sectionTitle}>Administrator Details</h3>
          <div style={styles.grid}>
            <div style={styles.statCard}>
              <p style={styles.statValue}>Full</p>
              <p style={styles.statLabel}>Access Level</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>All</p>
              <p style={styles.statLabel}>Departments</p>
            </div>
            <div style={styles.statCard}>
              <p style={{ ...styles.statValue, color: '#34D399' }}>Active</p>
              <p style={styles.statLabel}>Account Status</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- HR Coordinator: Overview ---- */}
      {role === 'hr_coordinator' && (
        <div style={styles.glass}>
          <h3 style={styles.sectionTitle}>HR Coordinator Overview</h3>
          <div style={styles.grid}>
            <div style={styles.statCard}>
              <p style={styles.statValue}>All</p>
              <p style={styles.statLabel}>Departments</p>
            </div>
            <div style={styles.statCard}>
              <p style={{ ...styles.statValue, color: '#34D399' }}>Active</p>
              <p style={styles.statLabel}>Account Status</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>HR</p>
              <p style={styles.statLabel}>Division</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
