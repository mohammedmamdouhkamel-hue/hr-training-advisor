import type { PlatformKey, PlatformConfig } from '../types/platform';

export const PLATFORMS: Record<PlatformKey, PlatformConfig> = {
  linkedin:    { name: 'LinkedIn Learning', color: '#0A66C2', icon: 'in', bg: '#E8F0FE' },
  youtube:     { name: 'YouTube',           color: '#FF0000', icon: '▶',  bg: '#FFE8E8' },
  coursera:    { name: 'Coursera',          color: '#0056D2', icon: 'C',  bg: '#E8F0FF' },
  udemy:       { name: 'Udemy',             color: '#A435F0', icon: 'U',  bg: '#F3E8FF' },
  pluralsight: { name: 'Pluralsight',       color: '#F15B2A', icon: 'P',  bg: '#FFF0EB' },
  aim:         { name: 'AIM',               color: '#00897B', icon: 'A',  bg: '#E0F5F3' },
};

export const PLATFORM_KEYS: PlatformKey[] = ['youtube', 'coursera', 'udemy', 'pluralsight', 'aim', 'linkedin'];
