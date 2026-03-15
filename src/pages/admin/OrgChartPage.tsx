import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, Crown, Shield, User as UserIcon } from 'lucide-react';
import type { User } from '../../types/auth';
import { mockAuthProvider } from '../../auth/mock-auth-provider';

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  admin:          { bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.35)', text: '#FCA5A5' },
  hr_coordinator: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.35)', text: '#C4B5FD' },
  manager:        { bg: 'rgba(5,150,105,0.12)',  border: 'rgba(5,150,105,0.35)',  text: '#6EE7B7' },
  employee:       { bg: 'rgba(37,99,235,0.12)',  border: 'rgba(37,99,235,0.35)',  text: '#93C5FD' },
};

export default function OrgChartPage() {
  const navigate = useNavigate();
  const users = useMemo(() => mockAuthProvider.getUsers(), []);

  const admins = users.filter(u => u.role === 'admin');
  const hrCoords = users.filter(u => u.role === 'hr_coordinator');
  const managers = users.filter(u => u.role === 'manager');
  const unassigned = users.filter(u => u.role === 'employee' && !u.managerId);

  const handleClick = (user: User) => {
    if (user.role === 'employee') {
      navigate(`/employees/${encodeURIComponent(user.fullName)}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 1100 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Network size={22} style={{ color: '#8B5CF6' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Organisation Chart</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>{users.length} people across {new Set(users.map(u => u.department)).size} departments</p>
        </div>
      </div>

      {/* Top level: Admin + HR */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 8 }}>
        {admins.map(u => <PersonCard key={u.id} user={u} icon={<Crown size={14} />} onClick={() => handleClick(u)} />)}
        {hrCoords.map(u => <PersonCard key={u.id} user={u} icon={<Shield size={14} />} onClick={() => handleClick(u)} />)}
      </div>

      {/* Connector line */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 8px' }}>
        <div style={{ width: 2, height: 28, background: 'rgba(99,102,241,0.3)' }} />
      </div>

      {/* Horizontal connector bar */}
      {managers.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{
            height: 2,
            width: `${Math.min(managers.length * 280, 900)}px`,
            background: 'rgba(99,102,241,0.25)',
          }} />
        </div>
      )}

      {/* Managers with their teams */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        {managers.map(mgr => {
          const team = users.filter(u => mgr.directReportIds.includes(u.id));
          return (
            <div key={mgr.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200 }}>
              {/* Vertical connector from bar to manager */}
              <div style={{ width: 2, height: 16, background: 'rgba(99,102,241,0.25)' }} />

              <PersonCard user={mgr} icon={<Shield size={14} />} onClick={() => handleClick(mgr)} />

              {/* Vertical connector from manager to team */}
              {team.length > 0 && (
                <div style={{ width: 2, height: 16, background: 'rgba(5,150,105,0.25)' }} />
              )}

              {/* Team members */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                {team.map(emp => (
                  <motion.div key={emp.id}
                    whileHover={{ scale: 1.02, borderColor: 'rgba(99,102,241,0.4)' }}
                    onClick={() => handleClick(emp)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 8, cursor: emp.role === 'employee' ? 'pointer' : 'default',
                      background: ROLE_COLORS.employee.bg,
                      border: `1px solid ${ROLE_COLORS.employee.border}`,
                      transition: 'border-color 0.15s',
                      minWidth: 170,
                    }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <UserIcon size={12} style={{ color: '#93C5FD' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E2E8F0' }}>{emp.fullName}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{emp.department}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned employees */}
      {unassigned.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94A3B8', margin: '0 0 10px' }}>
            Unassigned Employees ({unassigned.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unassigned.map(emp => (
              <motion.div key={emp.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleClick(emp)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <UserIcon size={12} style={{ color: '#64748B' }} />
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>{emp.fullName}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PersonCard({ user, icon, onClick }: { user: User; icon: React.ReactNode; onClick: () => void }) {
  const colors = ROLE_COLORS[user.role] || ROLE_COLORS.employee;
  return (
    <motion.div
      whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px', borderRadius: 12,
        background: colors.bg, border: `1px solid ${colors.border}`,
        cursor: user.role === 'employee' ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: `${colors.border}55`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.82rem', fontWeight: 700, color: colors.text,
      }}>
        {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon} {user.fullName}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{user.department}</div>
      </div>
    </motion.div>
  );
}
