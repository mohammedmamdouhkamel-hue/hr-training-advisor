import { useState, useMemo } from 'react';
import { Search, AlertTriangle, TrendingUp, Award, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../../types/employee';
import type { TrainingPlan } from '../../types/training-plan';
import EmployeeCard from '../employees/EmployeeCard';

interface SidebarProps {
  employees: Employee[];
  selected: Employee | null;
  plans: Record<string, TrainingPlan>;
  uploadedFile: string | null;
  onSelect: (emp: Employee) => void;
}

type FilterCategory = 'all' | 'needsFocus' | 'developing' | 'strong';

export default function Sidebar({ employees, selected, plans, uploadedFile, onSelect }: SidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');

  const filtered = useMemo(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q),
      );
    }
    if (filter === 'needsFocus') result = result.filter(e => e.score < 65);
    else if (filter === 'developing') result = result.filter(e => e.score >= 65 && e.score < 80);
    else if (filter === 'strong') result = result.filter(e => e.score >= 80);
    return result;
  }, [employees, search, filter]);

  const needsFocus = filtered.filter(e => e.score < 65);
  const developing = filtered.filter(e => e.score >= 65 && e.score < 80);
  const strong     = filtered.filter(e => e.score >= 80);

  const counts = {
    needsFocus: employees.filter(e => e.score < 65).length,
    developing: employees.filter(e => e.score >= 65 && e.score < 80).length,
    strong: employees.filter(e => e.score >= 80).length,
    plans: Object.keys(plans).length,
  };

  return (
    <aside className="app-sidebar" role="complementary" aria-label="Employee list"
      style={{ width: 320, borderRight: '1px solid var(--surface-border)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <FolderOpen size={12} /> {uploadedFile}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{t('sidebar.employees_other', { count: employees.length })}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          {([
            ['#EF4444', counts.needsFocus, t('sidebar.needsFocus')],
            ['#F59E0B', counts.developing, t('sidebar.developing')],
            ['#10B981', counts.strong, t('sidebar.strong')],
            ['#3B82F6', counts.plans, t('sidebar.plansReady')],
          ] as const).map(([color, count, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            className="search-input"
            type="text"
            placeholder={t('sidebar.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search employees by name, role, or department"
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {([
            ['all', t('sidebar.all'), null],
            ['needsFocus', t('sidebar.needsFocus'), AlertTriangle],
            ['developing', t('sidebar.developing'), TrendingUp],
            ['strong', t('sidebar.strong'), Award],
          ] as [string, string, typeof AlertTriangle | null][]).map(([key, label, Icon]) => (
            <button
              key={key}
              className={`filter-chip ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key as FilterCategory)}
              aria-pressed={filter === key}
            >
              {Icon && <Icon size={12} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }} role="list" aria-label="Employee cards">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-subtle)', fontSize: 13 }}>
            {t('sidebar.noMatch')}
          </div>
        )}
        {needsFocus.length > 0 && <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} /> {t('sidebar.needsFocus')}
          </div>
          {needsFocus.map(e => <EmployeeCard key={e.name} emp={e} onSelect={onSelect} isSelected={selected?.name === e.name} hasPlan={!!plans[e.name]} />)}
        </>}
        {developing.length > 0 && <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} /> {t('sidebar.developing')}
          </div>
          {developing.map(e => <EmployeeCard key={e.name} emp={e} onSelect={onSelect} isSelected={selected?.name === e.name} hasPlan={!!plans[e.name]} />)}
        </>}
        {strong.length > 0 && <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Award size={12} /> {t('sidebar.strong')}
          </div>
          {strong.map(e => <EmployeeCard key={e.name} emp={e} onSelect={onSelect} isSelected={selected?.name === e.name} hasPlan={!!plans[e.name]} />)}
        </>}
      </div>
    </aside>
  );
}
