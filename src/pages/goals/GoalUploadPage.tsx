import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  ArrowLeft, Trash2, X,
} from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import { transformGoalData, validateGoalWeights } from '../../utils/goal-transformer';
import type { Goal, GoalUploadMeta } from '../../types/goal';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GoalUploadPage() {
  const navigate = useNavigate();
  const { setGoals, setGoalUploadMeta, goalUploadMeta } = useGoals();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedGoals, setParsedGoals] = useState<Goal[]>([]);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [saved, setSaved] = useState(false);

  const validation = parsedGoals.length > 0 ? validateGoalWeights(parsedGoals) : null;

  const processFile = useCallback(async (file: File) => {
    setError('');
    setParsedGoals([]);
    setSaved(false);
    setFilename(file.name);

    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'csv' && ext !== 'xls') {
      setError('Please upload an .xlsx, .xls, or .csv file.');
      return;
    }

    try {
      // Dynamic import for xlsx
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) { setError('No sheets found in the workbook.'); return; }

      const sheet = workbook.Sheets[sheetName];
      if (!sheet) { setError('Empty sheet.'); return; }

      const jsonData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
      if (jsonData.length < 2) { setError('File must have a header row and at least one data row.'); return; }

      const headers = jsonData[0].map(String);
      const rows = jsonData.slice(1).filter(r => r.some(c => String(c).trim()));

      const goals = transformGoalData(headers, rows);
      if (goals.length === 0) {
        setError('No goals could be parsed. Check that column headers match the expected format.');
        return;
      }

      setParsedGoals(goals);
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleConfirm = () => {
    setGoals(parsedGoals);
    const uniqueEmployees = new Set(parsedGoals.map(g => g.employeeName));
    const meta: GoalUploadMeta = {
      filename,
      goalCount: parsedGoals.length,
      employeeCount: uniqueEmployees.size,
      uploadedAt: new Date().toISOString(),
      invalidWeightEmployees: validation?.invalid.map(d => d.employeeName) ?? [],
    };
    setGoalUploadMeta(meta);
    setSaved(true);
  };

  const handleClear = () => {
    setParsedGoals([]);
    setFilename('');
    setError('');
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div
      initial="hidden" animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } } }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 960 }}
    >
      {/* Back */}
      <motion.button
        variants={itemVariants}
        onClick={() => navigate('/goals')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
          background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
          fontSize: '0.85rem', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to Goals
      </motion.button>

      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Import
          </span>{' '}
          Goals
        </h1>
        <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.88rem' }}>
          Upload a SuccessFactors goal export (.xlsx or .csv)
        </p>
      </motion.div>

      {/* Previous upload info */}
      {goalUploadMeta && !saved && (
        <motion.div variants={itemVariants} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', fontSize: '0.8rem', color: '#A5B4FC',
        }}>
          <FileSpreadsheet size={14} style={{ flexShrink: 0, color: '#818CF8' }} />
          <span>
            Previously imported: <strong>{goalUploadMeta.goalCount} goals</strong> from <strong>{goalUploadMeta.filename}</strong> ({goalUploadMeta.employeeCount} employees)
          </span>
        </motion.div>
      )}

      {/* Dropzone */}
      {parsedGoals.length === 0 && !saved && (
        <motion.div
          variants={itemVariants}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            borderRadius: 16, padding: '48px 32px', marginBottom: 20,
            background: isDragOver ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.7)',
            border: `2px dashed ${isDragOver ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            textAlign: 'center', cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <Upload size={36} style={{ color: isDragOver ? '#818CF8' : '#475569', marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#CBD5E1', fontWeight: 600 }}>
            Drop your file here, or click to browse
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Supports .xlsx, .xls, and .csv
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '12px 18px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#F87171', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              padding: '20px 24px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={40} style={{ color: '#34D399', marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#34D399' }}>Goals Imported Successfully</p>
            <p style={{ margin: '4px 0 16px', fontSize: '0.84rem', color: '#94A3B8' }}>
              {parsedGoals.length} goals for {new Set(parsedGoals.map(g => g.employeeName)).size} employees saved.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/goals')}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
                  color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                View Goals
              </button>
              <button
                onClick={handleClear}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94A3B8', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Upload Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      {parsedGoals.length > 0 && !saved && (
        <>
          {/* File info bar */}
          <motion.div variants={itemVariants} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '12px 18px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileSpreadsheet size={18} style={{ color: '#818CF8' }} />
              <span style={{ color: '#CBD5E1', fontSize: '0.84rem', fontWeight: 600 }}>{filename}</span>
              <span style={{ color: '#64748B', fontSize: '0.78rem' }}>&middot; {parsedGoals.length} goals, {new Set(parsedGoals.map(g => g.employeeName)).size} employees</span>
            </div>
            <button onClick={handleClear} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#F87171', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              <Trash2 size={12} /> Clear
            </button>
          </motion.div>

          {/* Weight validation report */}
          {validation && validation.invalid.length > 0 && (
            <motion.div variants={itemVariants} style={{
              padding: '14px 18px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} style={{ color: '#FBBF24' }} />
                <span style={{ color: '#FCD34D', fontSize: '0.84rem', fontWeight: 600 }}>
                  {validation.invalid.length} employee(s) have invalid weight totals
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {validation.invalid.map(doc => (
                  <span key={doc.employeeName} style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                    background: 'rgba(245,158,11,0.1)', color: '#FBBF24',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}>
                    {doc.employeeName} ({doc.weightTotal}%)
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Preview table */}
          <motion.div variants={itemVariants} style={{
            borderRadius: 12, overflow: 'hidden', marginBottom: 20,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)' }}>
                    {['Employee', 'Title', 'Category', 'Weight', 'Rating', 'Progress'].map(h => (
                      <th key={h} style={{
                        padding: '12px 14px', textAlign: 'left', color: '#64748B', fontWeight: 600,
                        fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedGoals.slice(0, 50).map((g, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px', color: '#CBD5E1', fontWeight: 500, whiteSpace: 'nowrap' }}>{g.employeeName}</td>
                      <td style={{ padding: '10px 14px', color: '#F8FAFC', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{g.category === 'Personal goals' ? 'Personal' : 'Dept/Svc'}</td>
                      <td style={{ padding: '10px 14px', color: '#CBD5E1', fontWeight: 600 }}>{g.weight}%</td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{g.rating}</td>
                      <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{g.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedGoals.length > 50 && (
              <div style={{ padding: '10px 14px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                Showing 50 of {parsedGoals.length} goals
              </div>
            )}
          </motion.div>

          {/* Confirm */}
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleConfirm}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
                color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <CheckCircle2 size={16} /> Confirm &amp; Save {parsedGoals.length} Goals
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '12px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94A3B8', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
