import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { RoleBadge } from '../shared/RoleBadge';
import type { UserRole } from '../../types/auth';

/** Role → avatar accent colour (matches design system) */
const ROLE_AVATAR_COLOR: Record<UserRole, string> = {
  admin:          '#DC2626',
  manager:        '#059669',
  employee:       '#2563EB',
  hr_coordinator: '#7C3AED',
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click (keyboard-safe)
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = useCallback(async () => {
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  if (!user) return null;

  const avatarColor = ROLE_AVATAR_COLOR[user.role];
  const initials    = getInitials(user.fullName);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        id="user-menu-button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="user-menu-dropdown"
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px 6px 6px',
          borderRadius: '40px',
          background: open ? 'var(--surface-hover, rgba(99,102,241,0.12))' : 'transparent',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          cursor: 'pointer',
          transition: 'background 0.18s ease, border-color 0.18s ease',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
        onMouseEnter={e => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover, rgba(99,102,241,0.08))';
        }}
        onMouseLeave={e => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        {/* Avatar circle */}
        <span
          aria-hidden="true"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            boxShadow: `0 0 0 2px rgba(255,255,255,0.12), 0 0 8px ${avatarColor}55`,
          }}
        >
          {initials}
        </span>

        {/* Name + role (hidden on small screens) */}
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px',
          }}
          className="user-menu__name-block"
        >
          <span
            style={{
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.fullName}
          </span>
          <RoleBadge role={user.role} size="sm" />
        </span>

        <ChevronDown
          size={14}
          aria-hidden="true"
          style={{
            color: 'var(--text-muted, #94A3B8)',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="user-menu-dropdown"
            role="menu"
            aria-labelledby="user-menu-button"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '220px',
              borderRadius: '12px',
              background: 'var(--surface-bg, rgba(15,23,42,0.92))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              padding: '6px',
              zIndex: 1000,
              outline: 'none',
            }}
          >
            {/* User info header inside dropdown */}
            <div
              style={{
                padding: '10px 12px 10px',
                borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                marginBottom: '4px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-primary, #F8FAFC)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.fullName}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  color: 'var(--text-muted, #94A3B8)',
                  fontSize: '0.72rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </p>
            </div>

            {/* Menu items */}
            {[
              { icon: User,     label: 'Profile',  action: () => { setOpen(false); navigate('/profile'); } },
              { icon: Settings, label: 'Settings', action: () => { setOpen(false); navigate('/settings'); } },
            ].map(item => (
              <button
                key={item.label}
                role="menuitem"
                onClick={item.action}
                style={menuItemStyle(false)}
                onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, menuItemStyle(true))}
                onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, menuItemStyle(false))}
              >
                <item.icon size={15} aria-hidden="true" style={{ color: 'var(--text-muted, #94A3B8)', flexShrink: 0 }} />
                {item.label}
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--border-subtle, rgba(255,255,255,0.08))', margin: '4px 0' }} />

            {/* Logout */}
            <button
              role="menuitem"
              onClick={handleLogout}
              style={{
                ...menuItemStyle(false),
                color: '#F87171',
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { ...menuItemStyle(true), background: 'rgba(248,113,113,0.12)', color: '#F87171' })}
              onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { ...menuItemStyle(false), color: '#F87171' })}
            >
              <LogOut size={15} aria-hidden="true" style={{ color: '#F87171', flexShrink: 0 }} />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function menuItemStyle(hovered: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    background: hovered ? 'var(--surface-hover, rgba(99,102,241,0.1))' : 'transparent',
    border: 'none',
    color: 'var(--text-primary, #F8FAFC)',
    fontSize: '0.83rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  };
}

export default UserMenu;
