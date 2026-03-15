import React from 'react';
import type { UserRole } from '../../types/auth';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string; border: string }> = {
  admin:          { label: 'Admin',          bg: 'rgba(220,38,38,0.15)',  text: '#DC2626', border: 'rgba(220,38,38,0.3)'  },
  manager:        { label: 'Manager',        bg: 'rgba(5,150,105,0.15)',  text: '#059669', border: 'rgba(5,150,105,0.3)'  },
  employee:       { label: 'Employee',       bg: 'rgba(37,99,235,0.15)',  text: '#2563EB', border: 'rgba(37,99,235,0.3)'  },
  hr_coordinator: { label: 'HR Coordinator', bg: 'rgba(124,58,237,0.15)', text: '#7C3AED', border: 'rgba(124,58,237,0.3)' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const config = ROLE_CONFIG[role];
  const padding  = size === 'sm' ? '2px 8px'  : '4px 12px';
  const fontSize = size === 'sm' ? '0.65rem'  : '0.75rem';

  return (
    <span
      role="img"
      aria-label={`Role: ${config.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        borderRadius: '999px',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {config.label}
    </span>
  );
};

export default RoleBadge;
