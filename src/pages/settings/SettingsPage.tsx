// src/pages/settings/SettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface NotificationPrefs {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  weeklyDigest: boolean;
}

type DisplayDensity = 'compact' | 'comfortable';

interface SettingsState {
  notifications: NotificationPrefs;
  displayDensity: DisplayDensity;
}

const STORAGE_KEY = 'hr-training-settings';

const DEFAULT_SETTINGS: SettingsState = {
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weeklyDigest: true,
  },
  displayDensity: 'comfortable',
};

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */
function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications ?? {}) },
        displayDensity: parsed.displayDensity ?? DEFAULT_SETTINGS.displayDensity,
      };
    }
  } catch {
    // Safari private mode or quota exceeded — fall back silently
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: SettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // noop
  }
}

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 20,
    marginTop: 0,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  toggleLabel: {
    fontSize: 15,
    color: '#E2E8F0',
  },
  toggleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  densityOption: {
    padding: '12px 20px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center' as const,
    flex: 1,
  },
  densityActive: {
    background: 'rgba(99, 102, 241, 0.20)',
    borderColor: '#6366F1',
    color: '#818CF8',
  },
  densityInactive: {
    background: 'rgba(255,255,255,0.03)',
    color: '#94A3B8',
  },
  adminLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 10,
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.30)',
    color: '#818CF8',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  comingSoon: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
};

/* ------------------------------------------------------------------ */
/*  Toggle Switch sub-component                                        */
/* ------------------------------------------------------------------ */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
}) => {
  const trackStyle: React.CSSProperties = {
    width: 44,
    height: 24,
    borderRadius: 12,
    background: checked
      ? 'rgba(99, 102, 241, 0.6)'
      : 'rgba(255, 255, 255, 0.10)',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.2s',
    flexShrink: 0,
    border: checked
      ? '1px solid rgba(99, 102, 241, 0.8)'
      : '1px solid rgba(255,255,255,0.15)',
  };

  const thumbStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: checked ? '#818CF8' : '#64748B',
    position: 'absolute',
    top: 2,
    left: checked ? 22 : 3,
    transition: 'left 0.2s, background 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  };

  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        ...trackStyle,
        outline: 'none',
        padding: 0,
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <div style={thumbStyle} />
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  // Persist on every change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toggleNotification = useCallback(
    (key: keyof NotificationPrefs) => {
      setSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key],
        },
      }));
    },
    []
  );

  const setDensity = useCallback((d: DisplayDensity) => {
    setSettings((prev) => ({ ...prev, displayDensity: d }));
  }, []);

  if (!user) return null;

  const role = user.role ?? 'employee';

  const NOTIFICATION_TOGGLES: {
    key: keyof NotificationPrefs;
    label: string;
    description: string;
  }[] = [
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive training reminders and updates via email',
    },
    {
      key: 'pushNotifications',
      label: 'Push Notifications',
      description: 'Browser push notifications for urgent items',
    },
    {
      key: 'smsNotifications',
      label: 'SMS Notifications',
      description: 'Text message alerts for critical deadlines',
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly Digest',
      description: 'Summary of training activity every Monday',
    },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Settings</h1>

      {/* ---- Notification Preferences ---- */}
      <div style={styles.glass}>
        <h3 style={styles.sectionTitle}>Notification Preferences</h3>
        {NOTIFICATION_TOGGLES.map((t, i) => (
          <div
            key={t.key}
            style={{
              ...styles.toggleRow,
              borderBottom:
                i === NOTIFICATION_TOGGLES.length - 1
                  ? 'none'
                  : styles.toggleRow.borderBottom,
            }}
          >
            <div>
              <div style={styles.toggleLabel}>{t.label}</div>
              <div style={styles.toggleSub}>{t.description}</div>
            </div>
            <ToggleSwitch
              checked={settings.notifications[t.key]}
              onChange={() => toggleNotification(t.key)}
              label={t.label}
            />
          </div>
        ))}
      </div>

      {/* ---- Display Preferences ---- */}
      <div style={styles.glass}>
        <h3 style={styles.sectionTitle}>Display Preferences</h3>
        <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 16, marginTop: 0 }}>
          Choose your preferred layout density
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['compact', 'comfortable'] as DisplayDensity[]).map((d) => {
            const isActive = settings.displayDensity === d;
            return (
              <button
                key={d}
                onClick={() => setDensity(d)}
                style={{
                  ...styles.densityOption,
                  ...(isActive ? styles.densityActive : styles.densityInactive),
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                }}
                aria-pressed={isActive}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>
                  {d === 'compact' ? '\u25A4' : '\u25A6'}
                </div>
                <div style={{ textTransform: 'capitalize' }}>{d}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Theme (Placeholder) ---- */}
      <div style={styles.glass}>
        <h3 style={styles.sectionTitle}>Theme</h3>
        <div style={styles.comingSoon}>
          Theme customisation coming soon. Currently using dark mode.
        </div>
      </div>

      {/* ---- Admin: System Configuration ---- */}
      {role === 'admin' && (
        <div style={styles.glass}>
          <h3 style={styles.sectionTitle}>Administration</h3>
          <button
            style={{
              ...styles.adminLink,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onClick={() => navigate('/admin/config')}
          >
            System Configuration
          </button>
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: '#64748B',
              marginBottom: 0,
            }}
          >
            Manage organisation-wide training policies, compliance rules, and
            user provisioning.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
