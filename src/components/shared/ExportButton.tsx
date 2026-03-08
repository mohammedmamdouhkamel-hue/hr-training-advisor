import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Sheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Employee } from '../../types/employee';
import type { TrainingPlan } from '../../types/training-plan';
import { exportPlanToPDF, exportAllPlansToPDF } from '../../services/export-pdf';
import { exportPlanToExcel, exportAllPlansToExcel } from '../../services/export-excel';

interface ExportButtonProps {
  employee: Employee;
  plan: TrainingPlan;
  allEmployees?: Employee[];
  allPlans?: Record<string, TrainingPlan>;
}

export default function ExportButton({ employee, plan, allEmployees, allPlans }: ExportButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleExportPDF = () => {
    exportPlanToPDF(employee, plan);
    setOpen(false);
  };

  const handleExportExcel = () => {
    exportPlanToExcel(employee, plan);
    setOpen(false);
  };

  const handleExportAllPDF = () => {
    if (allEmployees && allPlans) {
      exportAllPlansToPDF(allEmployees, allPlans);
    }
    setOpen(false);
  };

  const handleExportAllExcel = () => {
    if (allEmployees && allPlans) {
      exportAllPlansToExcel(allEmployees, allPlans);
    }
    setOpen(false);
  };

  const hasAllData = allEmployees && allPlans && Object.keys(allPlans).length > 0;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          border: 'none',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <Download size={14} />
        {t('export.export')}
        <span
          style={{
            marginLeft: 2,
            fontSize: 10,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}
        >
          &#9662;
        </span>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            minWidth: 220,
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Section: Current Employee */}
          <div
            style={{
              padding: '10px 14px 6px',
              fontSize: 10,
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            {t('export.currentEmployee')}
          </div>

          <MenuItem icon={<FileText size={14} />} label={t('export.exportPdf')} onClick={handleExportPDF} />
          <MenuItem icon={<Sheet size={14} />} label={t('export.exportExcel')} onClick={handleExportExcel} />

          {/* Section: All Employees */}
          {hasAllData && (
            <>
              <div
                style={{
                  height: 1,
                  background: '#E2E8F0',
                  margin: '4px 0',
                }}
              />
              <div
                style={{
                  padding: '10px 14px 6px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                {t('export.allEmployees')}
              </div>

              <MenuItem
                icon={<FileText size={14} />}
                label={t('export.exportAllPdf')}
                onClick={handleExportAllPDF}
              />
              <MenuItem
                icon={<Sheet size={14} />}
                label={t('export.exportAllExcel')}
                onClick={handleExportAllExcel}
              />
            </>
          )}

          {/* Footer padding */}
          <div style={{ height: 4 }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        color: '#1E293B',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: '#64748B', display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}
