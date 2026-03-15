import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog, Shield, Mail, Calendar, Plus, Pencil, Trash2,
  X, Save, Users, ChevronDown,
} from 'lucide-react';
import type { User, UserRole } from '../../types/auth';
import { mockAuthProvider } from '../../auth/mock-auth-provider';

const ROLE_COLORS: Record<string, string> = {
  admin: '#DC2626',
  manager: '#059669',
  employee: '#2563EB',
  hr_coordinator: '#7C3AED',
};
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
  hr_coordinator: 'HR Coordinator',
};
const ROLES: UserRole[] = ['admin', 'manager', 'employee', 'hr_coordinator'];
const DEPARTMENTS = ['Engineering', 'Marketing', 'Operations', 'Human Resources', 'IT', 'Finance', 'Sales'];

interface FormData {
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  managerId: string;
}

const EMPTY_FORM: FormData = { fullName: '', email: '', role: 'employee', department: 'Engineering', managerId: '' };

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(() => mockAuthProvider.getUsers());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [assigningTeam, setAssigningTeam] = useState<string | null>(null);

  const managers = useMemo(() => users.filter(u => u.role === 'manager'), [users]);

  const refresh = useCallback(() => setUsers(mockAuthProvider.getUsers()), []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      managerId: user.managerId || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    try {
      if (editingId) {
        await mockAuthProvider.updateUser(editingId, {
          fullName: form.fullName.trim(),
          department: form.department,
          role: form.role,
          managerId: form.managerId || undefined,
        });
        // If role changed to manager and had a managerId, also update the old manager's directReportIds
        // and the new manager's directReportIds
      } else {
        await mockAuthProvider.createUser({
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          role: form.role,
          department: form.department,
          managerId: form.managerId || undefined,
          directReportIds: [],
          isActive: true,
        });
      }
      // If the user is being assigned to a manager, update that manager's directReportIds
      if (form.managerId && form.role === 'employee') {
        const allUsers = mockAuthProvider.getUsers();
        const mgr = allUsers.find(u => u.id === form.managerId);
        const targetUser = allUsers.find(u => editingId ? u.id === editingId : u.email.toLowerCase() === form.email.trim().toLowerCase());
        if (mgr && targetUser && !mgr.directReportIds.includes(targetUser.id)) {
          await mockAuthProvider.updateUser(mgr.id, {
            directReportIds: [...mgr.directReportIds, targetUser.id],
          });
        }
      }
      setShowForm(false);
      setEditingId(null);
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    if (!window.confirm(`Delete user "${user.fullName}"? This cannot be undone.`)) return;
    try {
      // Remove from any manager's directReportIds
      if (user.managerId) {
        const mgr = users.find(u => u.id === user.managerId);
        if (mgr) {
          await mockAuthProvider.updateUser(mgr.id, {
            directReportIds: mgr.directReportIds.filter(rid => rid !== id),
          });
        }
      }
      await mockAuthProvider.deleteUser(id);
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handleAssignEmployee = async (managerId: string, employeeId: string, add: boolean) => {
    const mgr = users.find(u => u.id === managerId);
    if (!mgr) return;
    const newReports = add
      ? [...mgr.directReportIds, employeeId]
      : mgr.directReportIds.filter(id => id !== employeeId);
    await mockAuthProvider.updateUser(managerId, { directReportIds: newReports });
    // Also update the employee's managerId
    if (add) {
      await mockAuthProvider.updateUser(employeeId, { managerId });
    } else {
      await mockAuthProvider.updateUser(employeeId, { managerId: undefined });
    }
    refresh();
  };

  const employees = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#F8FAFC', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'none', cursor: 'pointer',
    backgroundImage: 'none',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>User Management</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
            {users.length} users — {managers.length} managers, {employees.length} employees
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
        }}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Error */}
      {error && !showForm && (
        <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: '0.82rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              borderRadius: 14, padding: '24px 28px', marginBottom: 20,
              background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                {editingId ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontSize: '0.8rem', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Full Name</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle} placeholder="John Doe" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="john@company.com" disabled={!!editingId} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} style={selectStyle}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, bottom: 13, color: '#64748B', pointerEvents: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Department</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={selectStyle}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, bottom: 13, color: '#64748B', pointerEvents: 'none' }} />
              </div>
              {form.role === 'employee' && (
                <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>Assign to Manager</label>
                  <select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))} style={selectStyle}>
                    <option value="">No manager assigned</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.department})</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 12, bottom: 13, color: '#64748B', pointerEvents: 'none' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '0.84rem',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>Cancel</button>
              <button onClick={handleSave} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}><Save size={14} /> {editingId ? 'Update' : 'Create'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Managers Section */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={16} style={{ color: '#059669' }} /> Managers & Teams
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {managers.map(mgr => {
          const teamMembers = employees.filter(e => mgr.directReportIds.includes(e.id));
          const isAssigning = assigningTeam === mgr.id;
          const unassigned = employees.filter(e => !e.managerId || e.managerId === mgr.id);

          return (
            <div key={mgr.id} style={{
              borderRadius: 12, background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
            }}>
              {/* Manager header */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', fontWeight: 700, color: '#059669',
                }}>
                  {mgr.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#F8FAFC' }}>{mgr.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{mgr.department} — {teamMembers.length} direct reports</div>
                </div>
                <button onClick={() => setAssigningTeam(isAssigning ? null : mgr.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 7, border: '1px solid rgba(99,102,241,0.3)',
                  background: isAssigning ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: '#A5B4FC', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  <Users size={13} /> {isAssigning ? 'Done' : 'Manage Team'}
                </button>
                <button onClick={() => openEdit(mgr)} style={{
                  background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4,
                }}><Pencil size={14} /></button>
              </div>

              {/* Team members */}
              {teamMembers.length > 0 && (
                <div style={{ padding: '8px 20px 12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {teamMembers.map(emp => (
                      <div key={emp.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                        borderRadius: 8, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
                      }}>
                        <span style={{ fontSize: '0.8rem', color: '#93C5FD' }}>{emp.fullName}</span>
                        {isAssigning && (
                          <button onClick={() => handleAssignEmployee(mgr.id, emp.id, false)} style={{
                            background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 0, display: 'flex',
                          }}><X size={12} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign panel */}
              <AnimatePresence>
                {isAssigning && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 8, fontWeight: 600 }}>
                        Click to assign/unassign employees:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {unassigned.filter(e => !mgr.directReportIds.includes(e.id) && (!e.managerId || e.managerId === mgr.id)).map(emp => (
                          <button key={emp.id} onClick={() => handleAssignEmployee(mgr.id, emp.id, true)} style={{
                            padding: '5px 12px', borderRadius: 7, fontSize: '0.78rem',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#CBD5E1', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                          }}>
                            + {emp.fullName}
                          </button>
                        ))}
                        {unassigned.filter(e => !mgr.directReportIds.includes(e.id) && !e.managerId).length === 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                            No unassigned employees available
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* All Users List */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserCog size={16} style={{ color: '#6366F1' }} /> All Users
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(user => {
          const roleColor = ROLE_COLORS[user.role] || '#6366F1';
          const mgr = user.managerId ? users.find(u => u.id === user.managerId) : null;
          return (
            <div key={user.id} style={{
              borderRadius: 12, padding: '14px 20px',
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `${roleColor}18`, border: `1px solid ${roleColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={15} style={{ color: roleColor }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#F8FAFC' }}>{user.fullName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, fontSize: '0.74rem', color: '#94A3B8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} /> {user.email}</span>
                  <span>{user.department}</span>
                  {mgr && <span style={{ color: '#059669' }}>Manager: {mgr.fullName}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} /> {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <span style={{
                padding: '3px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
                color: roleColor, background: `${roleColor}14`, border: `1px solid ${roleColor}28`,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {ROLE_LABELS[user.role] || user.role}
              </span>

              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: user.isActive ? '#34D399' : '#F87171',
                flexShrink: 0,
              }} title={user.isActive ? 'Active' : 'Inactive'} />

              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(user)} title="Edit user" style={{
                  background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4,
                }}><Pencil size={14} /></button>
                <button onClick={() => handleDelete(user.id)} title="Delete user" style={{
                  background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4,
                }}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
