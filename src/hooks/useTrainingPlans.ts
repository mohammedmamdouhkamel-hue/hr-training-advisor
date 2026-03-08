import { useState, useRef, useCallback } from 'react';
import type { Employee } from '../types/employee';
import type { TrainingPlan } from '../types/training-plan';
import { generateTrainingPlan } from '../services/api-client';
import { savePlans, loadPlans } from '../services/storage';
import { checkRateLimit } from '../services/rate-limiter';

export function useTrainingPlans(apiKey: string) {
  const [plans, setPlansState] = useState<Record<string, TrainingPlan>>(() => loadPlans() || {});
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const generatingRef = useRef(false);

  const setPlans = (updater: Record<string, TrainingPlan> | ((prev: Record<string, TrainingPlan>) => Record<string, TrainingPlan>)) => {
    setPlansState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      savePlans(next);
      return next;
    });
  };

  const doGenerate = useCallback(async (emp: Employee) => {
    if (generatingRef.current) return;

    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      setError(`Too many requests. Please wait ${rateCheck.waitSeconds} seconds before generating another plan.`);
      return;
    }

    generatingRef.current = true;
    setLoading(true);
    setError('');
    setLoadingMsg(`Analysing ${emp.name}'s performance data...`);
    const t1 = setTimeout(() => setLoadingMsg('Searching LinkedIn, YouTube, Coursera & more...'), 1800);
    const t2 = setTimeout(() => setLoadingMsg('Building personalised 90-day roadmap...'), 3500);
    try {
      const plan = await generateTrainingPlan(emp, apiKey);
      setPlans(prev => ({ ...prev, [emp.name]: plan }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      generatingRef.current = false;
    }
  }, [apiKey]);

  const generateAll = useCallback(async (
    employees: Employee[],
    onSelectForProgress: (emp: Employee) => void,
  ) => {
    if (generatingRef.current) return;
    for (const emp of employees.filter(e => !plans[e.name])) {
      onSelectForProgress(emp);
      await new Promise(r => setTimeout(r, 50));
      generatingRef.current = true;
      setLoading(true);
      setLoadingMsg(`Processing ${emp.name} (${employees.indexOf(emp) + 1}/${employees.length})...`);
      try {
        const plan = await generateTrainingPlan(emp, apiKey);
        setPlans(prev => ({ ...prev, [emp.name]: plan }));
      } catch {
        // continue to next employee
      }
      generatingRef.current = false;
    }
    setLoading(false);
  }, [apiKey, plans]);

  const autoGenerate = useCallback((selected: Employee | null) => {
    if (!selected || plans[selected.name] || generatingRef.current) return;
    doGenerate(selected);
  }, [plans, doGenerate]);

  return { plans, setPlans, loading, loadingMsg, error, setError, doGenerate, generateAll, autoGenerate, generatingRef };
}
