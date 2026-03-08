import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { Course } from '../../types/training-plan';
import type { PlatformKey } from '../../types/platform';
import { PLATFORMS, PLATFORM_KEYS } from '../../constants/platforms';
import CourseCard from './CourseCard';

interface EditableCourseCardProps {
  course: Course;
  onSave: (updated: Course) => void;
  onDelete: () => void;
}

export default function EditableCourseCard({ course, onSave, onDelete }: EditableCourseCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hover, setHover] = useState(false);

  const [title, setTitle] = useState(course.title);
  const [platform, setPlatform] = useState<PlatformKey>(course.platform);
  const [duration, setDuration] = useState(course.duration);
  const [description, setDescription] = useState(course.description);
  const [level, setLevel] = useState<Course['level']>(course.level);

  const handleSave = () => {
    onSave({
      ...course,
      title: title.trim(),
      platform,
      duration: duration.trim(),
      description: description.trim(),
      level,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(course.title);
    setPlatform(course.platform);
    setDuration(course.duration);
    setDescription(course.description);
    setLevel(course.level);
    setEditing(false);
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  };

  if (editing) {
    return (
      <div style={{
        background: 'var(--surface-card)',
        border: '2px solid #3B82F6',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 10,
      }}>
        {/* Title */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-bg)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Platform + Duration + Level row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Platform
            </label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value as PlatformKey)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-bg)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {PLATFORM_KEYS.map(key => (
                <option key={key} value={key}>{PLATFORMS[key].name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="e.g. 4 hours"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-bg)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Level
            </label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value as Course['level'])}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-bg)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleDeleteClick}
            onBlur={() => setConfirmDelete(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: confirmDelete ? '#EF4444' : '#FEE2E2',
              color: confirmDelete ? '#fff' : '#DC2626',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={12} />
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-card)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <X size={12} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: title.trim() ? '#0F172A' : '#94A3B8',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              <Check size={12} />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <CourseCard course={course} />
      {hover && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          gap: 4,
        }}>
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit course"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: '#0F172A',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.9,
              transition: 'opacity 0.15s ease',
            }}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => {
              if (confirmDelete) {
                onDelete();
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3000);
              }
            }}
            aria-label={confirmDelete ? 'Confirm delete course' : 'Delete course'}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: confirmDelete ? '#EF4444' : '#0F172A',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.9,
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
