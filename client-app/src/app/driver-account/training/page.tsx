'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { getDriverTraining, TrainingModule } from '@/api/client';
import { TrainingScreen } from '@/components/account/TrainingScreen';

type LessonCategory = 'ONBOARDING' | 'SAFETY' | 'SKILLS' | 'PLATFORM';

// module_type is a free-form string from the API; bucket it into the screen's
// four categories. PLATFORM is the catch-all so no module ever disappears.
function toCategory(moduleType: string): LessonCategory {
  const t = moduleType.toUpperCase();
  if (t.includes('ONBOARD')) return 'ONBOARDING';
  if (t.includes('SAFETY')) return 'SAFETY';
  if (t.includes('SKILL')) return 'SKILLS';
  return 'PLATFORM';
}

// duration_label is display text like "15 min"; extract the leading number.
function toDurationMin(label: string): number {
  const n = parseInt(label, 10);
  return Number.isFinite(n) ? n : 0;
}

export default function DriverTrainingPage() {
  const { token } = useAuthStore();
  const [modules, setModules] = useState<TrainingModule[]>([]);

  useEffect(() => {
    if (!token) return;
    getDriverTraining(token)
      .then((res) => setModules(res.modules))
      .catch(() => useToastStore.getState().show('Could not load training modules.', 'error'));
  }, [token]);

  const lessons = modules.map((m) => ({
    id: m.id,
    title: m.title,
    // No description field in the API yet — honest empty string.
    description: '',
    durationMin: toDurationMin(m.duration_label),
    // API exposes status only, not a percent — completed is 100, anything else 0.
    progress: m.status === 'COMPLETED' ? 100 : 0,
    isCompleted: m.status === 'COMPLETED',
    // No required flag in the API yet.
    isRequired: false,
    category: toCategory(m.module_type),
  }));

  const completedCount = lessons.filter((l) => l.isCompleted).length;

  return (
    <TrainingScreen
      lessons={lessons}
      completedCount={completedCount}
      totalCount={lessons.length}
    />
  );
}
