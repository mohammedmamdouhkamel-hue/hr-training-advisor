import { useState } from 'react';

export function useApiKey() {
  const [apiKey, setApiKey] = useState('');
  const clearKey = () => setApiKey('');
  return { apiKey, setApiKey, clearKey };
}
