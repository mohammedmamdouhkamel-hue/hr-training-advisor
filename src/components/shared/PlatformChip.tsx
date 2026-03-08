import { PLATFORMS } from '../../constants/platforms';
import type { PlatformKey } from '../../types/platform';

interface PlatformChipProps {
  platform: string;
}

export default function PlatformChip({ platform }: PlatformChipProps) {
  const p = PLATFORMS[platform as PlatformKey] || { name: platform, color: '#64748B', icon: '·', bg: '#F8F9FA' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: p.bg, color: p.color, border: `1px solid ${p.color}30`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      <span>{p.icon}</span>{p.name}
    </span>
  );
}
