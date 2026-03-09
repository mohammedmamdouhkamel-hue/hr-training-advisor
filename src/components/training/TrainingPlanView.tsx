import { useState } from 'react';
import { Target, Plus, RefreshCw, Pencil, Check, X } from 'lucide-react';
import type { TrainingPlan, Course } from '../../types/training-plan';
import type { Employee } from '../../types/employee';
import CompetencyBar from './CompetencyBar';
import EditableCourseCard from './EditableCourseCard';

interface TrainingPlanViewProps {
  plan: TrainingPlan;
  employee: Employee;
  onUpdatePlan?: (plan: TrainingPlan) => void;
}

function makeEmptyCourse(): Course {
  return {
    title: 'New Course',
    platform: 'coursera',
    duration: '2 hours',
    level: 'Beginner',
    description: '',
    search_query: '',
  };
}

export default function TrainingPlanView({ plan, employee, onUpdatePlan }: TrainingPlanViewProps) {
  const [tab, setTab] = useState(0);
  const [editingMilestone, setEditingMilestone] = useState<number | null>(null);
  const [milestoneGoalDraft, setMilestoneGoalDraft] = useState('');

  const handleCourseUpdate = (areaIndex: number, courseIndex: number, updatedCourse: Course) => {
    if (!onUpdatePlan) return;
    const newPlan = { ...plan, training_plan: plan.training_plan.map((area, ai) => {
      if (ai !== areaIndex) return area;
      return { ...area, courses: area.courses.map((c, ci) => ci === courseIndex ? updatedCourse : c) };
    })};
    onUpdatePlan(newPlan);
  };

  const handleCourseDelete = (areaIndex: number, courseIndex: number) => {
    if (!onUpdatePlan) return;
    const newPlan = { ...plan, training_plan: plan.training_plan.map((area, ai) => {
      if (ai !== areaIndex) return area;
      return { ...area, courses: area.courses.filter((_, ci) => ci !== courseIndex) };
    })};
    onUpdatePlan(newPlan);
  };

  const handleAddCourse = (areaIndex: number) => {
    if (!onUpdatePlan) return;
    const newPlan = { ...plan, training_plan: plan.training_plan.map((area, ai) => {
      if (ai !== areaIndex) return area;
      return { ...area, courses: [...area.courses, makeEmptyCourse()] };
    })};
    onUpdatePlan(newPlan);
  };

  const handleRegenerateArea = (areaIndex: number) => {
    // Regenerate is a placeholder: clears courses so the user can re-add them
    if (!onUpdatePlan) return;
    const newPlan = { ...plan, training_plan: plan.training_plan.map((area, ai) => {
      if (ai !== areaIndex) return area;
      return { ...area, courses: [] };
    })};
    onUpdatePlan(newPlan);
  };

  const handleMilestoneEdit = (index: number) => {
    setEditingMilestone(index);
    setMilestoneGoalDraft(plan.milestones[index].goal);
  };

  const handleMilestoneSave = (index: number) => {
    if (!onUpdatePlan) return;
    const newPlan = { ...plan, milestones: plan.milestones.map((m, i) => {
      if (i !== index) return m;
      return { ...m, goal: milestoneGoalDraft.trim() };
    })};
    onUpdatePlan(newPlan);
    setEditingMilestone(null);
  };

  const handleMilestoneCancel = () => {
    setEditingMilestone(null);
    setMilestoneGoalDraft('');
  };

  return (
    <div>
      {/* Header card */}
      <div className="plan-header" style={{ background: 'var(--gradient-brand)', borderRadius: 'var(--radius-md)', padding: '24px 28px', marginBottom: 20, color: '#fff' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-light)', fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>AI-Generated Training Plan</div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 4 }}>{employee.name}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', marginBottom: 16 }}>{employee.role} · {employee.department}</div>
        <p style={{ fontSize: 'var(--text-sm)', color: '#CBD5E1', lineHeight: 1.7, margin: 0 }}>{plan.summary}</p>
        {plan.expected_improvement && (
          <div style={{ marginTop: 16, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 'var(--text-xs)', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={14} /> {plan.expected_improvement}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Training plan sections" style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['Overview', 'Training Plan', 'Milestones'].map((t, i) => (
          <button key={t} role="tab" aria-selected={tab === i} aria-controls={`tabpanel-${i}`} id={`tab-${i}`}
            onClick={() => setTab(i)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', background: tab === i ? 'var(--color-primary-bg)' : 'var(--surface-code-bg)', color: tab === i ? 'var(--color-primary)' : 'var(--text-muted)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 0 && (
        <div role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Priority Focus Areas</div>
          {plan.priority_areas?.map((area, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-primary-bg)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 8 }}>
              <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)', fontSize: 'var(--text-sm)' }}>{area}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Competency Scores</div>
          {Object.entries(employee.competencies).map(([k, v]) => <CompetencyBar key={k} name={k} score={v} />)}
        </div>
      )}

      {/* Training Plan tab */}
      {tab === 1 && (
        <div role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
          {plan.training_plan?.map((area, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)', flex: 1 }}>{area.area}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{area.current_score}</span>
                  {' → '}
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{area.target_score}</span>
                </div>
                {onUpdatePlan && (
                  <button
                    onClick={() => handleRegenerateArea(i)}
                    aria-label={`Clear courses in ${area.area}`}
                    title="Clear all courses in this area"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-muted)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <RefreshCw size={11} />
                    Regenerate
                  </button>
                )}
              </div>
              {onUpdatePlan
                ? area.courses?.map((c, j) => (
                    <EditableCourseCard
                      key={j}
                      course={c}
                      onSave={(updated) => handleCourseUpdate(i, j, updated)}
                      onDelete={() => handleCourseDelete(i, j)}
                    />
                  ))
                : area.courses?.map((c, j) => (
                    <div key={j}>
                      {/* Read-only fallback - import CourseCard if needed */}
                      <EditableCourseCard
                        course={c}
                        onSave={() => {}}
                        onDelete={() => {}}
                      />
                    </div>
                  ))
              }
              {onUpdatePlan && (
                <button
                  onClick={() => handleAddCourse(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '2px dashed var(--surface-border)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    width: '100%',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    marginTop: 4,
                  }}
                >
                  <Plus size={14} />
                  Add Course
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Milestones tab */}
      {tab === 2 && (
        <div role="tabpanel" id="tabpanel-2" aria-labelledby="tab-2">
          {plan.milestones?.map((m, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-950)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 'var(--text-sm)', flexShrink: 0 }}>{i + 1}</div>
                {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--surface-border)', marginTop: 4 }} />}
              </div>
              <div style={{
                background: 'var(--surface-card)',
                border: editingMilestone === i ? '2px solid var(--color-primary)' : '1px solid var(--surface-border)',
                borderRadius: 12,
                padding: '14px 18px',
                flex: 1,
                position: 'relative',
                cursor: onUpdatePlan && editingMilestone !== i ? 'pointer' : 'default',
                transition: 'border-color 0.15s ease',
              }}
                onClick={() => {
                  if (onUpdatePlan && editingMilestone !== i) {
                    handleMilestoneEdit(i);
                  }
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary-light)', marginBottom: 4 }}>{m.week}</div>
                {editingMilestone === i && onUpdatePlan ? (
                  <div>
                    <textarea
                      value={milestoneGoalDraft}
                      onChange={e => setMilestoneGoalDraft(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      rows={3}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--surface-border)',
                        background: 'var(--surface-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        fontFamily: 'inherit',
                        lineHeight: 1.6,
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleMilestoneCancel(); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--surface-border)',
                          background: 'var(--surface-card)',
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <X size={11} />
                        Cancel
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleMilestoneSave(i); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'var(--color-primary-950)',
                          color: '#fff',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Check size={11} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>{m.goal}</div>
                    {onUpdatePlan && (
                      <Pencil size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2, opacity: 0.5 }} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
