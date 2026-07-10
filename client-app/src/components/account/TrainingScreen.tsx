'use client';

import React from 'react';
import { SectionHeader, StatusBadge } from '@/components/ds/redesign';

// ─── Training Academy Screen ───────────────────────────────────────────────────
// Onboarding lessons + skill-up modules. Completion rewards.
// Cards with progress, estimated time, and completion badge.

interface Lesson {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  progress: number; // 0-100
  isCompleted: boolean;
  isRequired: boolean;
  reward?: number;
  category: 'ONBOARDING' | 'SAFETY' | 'SKILLS' | 'PLATFORM';
}

interface TrainingScreenProps {
  lessons: Lesson[];
  completedCount: number;
  totalCount: number;
}

export function TrainingScreen({ lessons, completedCount, totalCount }: TrainingScreenProps) {
  const categories = ['ONBOARDING', 'SAFETY', 'SKILLS', 'PLATFORM'] as const;
  const categoryLabels = { ONBOARDING: 'Getting Started', SAFETY: 'Safety', SKILLS: 'Skills', PLATFORM: 'Platform' };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-secondary overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-background-primary px-500
        pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        border-b border-border-opaque">
        <h1 className="text-xl font-sans font-bold text-content-primary mb-200">Training Academy</h1>
        <div className="flex items-center gap-300">
          <div className="flex-1 h-1.5 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-accent-400 transition-[width] duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-content-secondary">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="px-500 py-400 space-y-500">
        {categories.map((cat) => {
          const catLessons = lessons.filter((l) => l.category === cat);
          if (catLessons.length === 0) return null;
          return (
            <div key={cat}>
              <SectionHeader title={categoryLabels[cat]} />
              <div className="space-y-300">
                {catLessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Lesson Card ────────────────────────────────────────────────────────────────

function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <div className={`rounded-sm border bg-background-primary overflow-hidden
      ${lesson.isCompleted ? 'border-positive-400' : 'border-border-opaque'}`}>
      <div className="px-400 py-3.5 flex items-start gap-300">
        {/* Status icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${lesson.isCompleted
            ? 'bg-positive-50 text-content-positive'
            : lesson.progress > 0
              ? 'bg-accent-50 text-accent-500'
              : 'bg-gray-50 text-content-tertiary'
          }`}
        >
          {lesson.isCompleted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polygon points="10,8 16,12 10,16" fill="currentColor" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-200 mb-100">
            <span className={`text-label-small font-sans font-semibold
              ${lesson.isCompleted ? 'text-content-secondary line-through' : 'text-content-primary'}`}>
              {lesson.title}
            </span>
            {lesson.isRequired && <StatusBadge label="Required" variant="warning" />}
          </div>
          <span className="text-[11px] font-sans text-content-secondary block">{lesson.description}</span>
          <div className="flex items-center gap-300 mt-200">
            <span className="text-[9px] font-mono text-content-tertiary">{lesson.durationMin} min</span>
            {lesson.reward && (
              <span className="text-[9px] font-mono font-bold text-accent-600">+₹{lesson.reward}</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar (if in progress) */}
      {!lesson.isCompleted && lesson.progress > 0 && (
        <div className="px-400 pb-300">
          <div className="h-1 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-accent-400"
              style={{ width: `${lesson.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
