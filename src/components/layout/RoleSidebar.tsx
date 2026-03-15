import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, BarChart3,
  UserCog, ScrollText, Settings, TrendingUp,
  Lightbulb, Upload, FileText, Download,
  ChevronLeft, Menu, X, Network,
} from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  path:  string;
  label: string;
  Icon:  React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false'; style?: React.CSSProperties }>;
  badge?: number;
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  admin: [
    { path: '/dashboard',         label: 'Dashboard',       Icon: LayoutDashboard },
    { path: '/employees',         label: 'Employees',       Icon: Users            },
    { path: '/upload',            label: 'Upload Results',  Icon: Upload           },
    { path: '/analytics',         label: 'Analytics',       Icon: BarChart3        },
    { path: '/admin/users',       label: 'User Management', Icon: UserCog          },
    { path: '/admin/org-chart',   label: 'Org Chart',       Icon: Network          },
    { path: '/admin/audit-log',   label: 'Audit Log',       Icon: ScrollText       },
    { path: '/admin/config',      label: 'System Config',   Icon: Settings         },
  ],
  manager: [
    { path: '/dashboard',       label: 'Team Dashboard',  Icon: LayoutDashboard },
    { path: '/team',            label: 'Team Members',    Icon: Users            },
    { path: '/analytics/team',  label: 'Team Analytics',  Icon: BarChart3        },
  ],
  employee: [
    { path: '/dashboard',       label: 'My Dashboard',    Icon: LayoutDashboard },
    { path: '/my-plan',         label: 'My Training Plan',Icon: BookOpen         },
    { path: '/my-progress',     label: 'My Progress',     Icon: TrendingUp       },
    { path: '/recommendations', label: 'Recommendations', Icon: Lightbulb        },
  ],
  hr_coordinator: [
    { path: '/dashboard',          label: 'Dashboard',          Icon: LayoutDashboard },
    { path: '/employees',          label: 'All Employees',      Icon: Users            },
    { path: '/upload',             label: 'Upload Results',     Icon: Upload           },
    { path: '/bulk-operations',    label: 'Bulk Operations',    Icon: FileText         },
    { path: '/analytics',          label: 'Dept Analytics',     Icon: BarChart3        },
    { path: '/admin/org-chart',    label: 'Org Chart',          Icon: Network          },
    { path: '/training-policies',  label: 'Training Policies',  Icon: BookOpen         },
    { path: '/reports',            label: 'Reports',            Icon: Download         },
  ],
};

const SIDEBAR_STORAGE_KEY = 'hr-advisor:sidebar-collapsed';

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RoleSidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed]       = useState<boolean>(getStoredCollapsed);
  const [mobileOpen, setMobileOpen]     = useState<boolean>(false);

  // Persist collapse state
  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Trap focus / close mobile on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  if (!user) return null;

  const items = NAV_CONFIG[user.role] ?? [];

  return (
    <>
      {/* ── Mobile hamburger toggle (shown ≤ 768px) ── */}
      <button
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        aria-controls="role-sidebar"
        onClick={() => setMobileOpen(prev => !prev)}
        className="sidebar-mobile-toggle"
        style={{
          display: 'none', // CSS media query overrides to flex on mobile
          position: 'fixed',
          top: '14px',
          left: '14px',
          zIndex: 1100,
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--surface-bg, rgba(15,23,42,0.9))',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
          color: 'var(--text-primary, #F8FAFC)',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>

      {/* ── Mobile overlay backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1099,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(2px)',
              display: 'none', // CSS shows on mobile
            }}
            className="sidebar-backdrop"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ── */}
      <motion.nav
        id="role-sidebar"
        aria-label="Main navigation"
        initial={false}
        animate={{ width: collapsed ? '68px' : '240px' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'relative',
          height: '100%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-bg, rgba(15,23,42,0.75))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          overflow: 'hidden',
          zIndex: 100,
        }}
        className={`role-sidebar${mobileOpen ? ' role-sidebar--mobile-open' : ''}`}
      >
        {/* Sidebar inner scroll container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            padding: '12px 8px',
            gap: '2px',
            overflowY: 'auto',
            overflowX: 'hidden',
            // Custom scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(99,102,241,0.3) transparent',
          }}
        >
          {/* Nav items */}
          {items.map(item => (
            <SidebarNavItem
              key={item.path}
              item={item}
              collapsed={collapsed}
            />
          ))}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Collapse toggle (desktop) */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              paddingTop: '8px',
              marginTop: '4px',
            }}
          >
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94A3B8)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'var(--surface-hover, rgba(99,102,241,0.1))';
                btn.style.color = 'var(--text-primary, #F8FAFC)';
              }}
              onMouseLeave={e => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-muted, #94A3B8)';
              }}
            >
              <motion.span
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ display: 'flex', flexShrink: 0 }}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </motion.span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    Collapse
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Inline media-query styles for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-mobile-toggle { display: flex !important; }
          .sidebar-backdrop { display: block !important; }
          .role-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            z-index: 1100 !important;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4,0,0.2,1) !important;
            width: 240px !important;
          }
          .role-sidebar--mobile-open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
};

// ─── Individual nav item ───────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item:      NavItem;
  collapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, collapsed }) => {
  return (
    <NavLink
      to={item.path}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: isActive
          ? '#FFFFFF'
          : 'var(--text-muted, #94A3B8)',
        background: isActive
          ? 'linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(139,92,246,0.75) 100%)'
          : 'transparent',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '0.84rem',
        fontWeight: isActive ? 600 : 500,
        position: 'relative',
        transition: 'background 0.15s ease, color 0.15s ease',
        boxShadow: isActive ? '0 2px 10px rgba(99,102,241,0.35)' : 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        minHeight: '40px',
      })}
      className="sidebar-nav-item"
    >
      {({ isActive }) => (
        <>
          <item.Icon
            size={18}
            aria-hidden="true"
            style={{
              flexShrink: 0,
              color: isActive ? '#FFFFFF' : 'var(--text-muted, #94A3B8)',
              transition: 'color 0.15s ease',
            }}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {item.badge !== undefined && item.badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                marginLeft: 'auto',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                background: '#EF4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                flexShrink: 0,
              }}
              aria-label={`${item.badge} notifications`}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </motion.span>
          )}
        </>
      )}
    </NavLink>
  );
};

export default RoleSidebar;
