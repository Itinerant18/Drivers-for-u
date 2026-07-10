'use client';

import React from 'react';
import { SectionHeader } from '@/components/ds/redesign';

// ─── Incentives & Quests Screen ────────────────────────────────────────────────
// Gamification layer — active quests with progress bars.
// Daily/Weekly challenges + streak bonuses + tier badges.

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number; // rupees
  progress: number; // 0-100
  target: number;
  current: number;
  unit: string; // "jobs", "km", "hours"
  deadline: string; // "12h left", "3 days"
  isCompleted: boolean;
  type: 'DAILY' | 'WEEKLY' | 'STREAK' | 'BONUS';
}

interface IncentivesScreenProps {
  activeQuests: Quest[];
  completedQuests: Quest[];
  streakDays: number;
  currentTier: string; // "Bronze", "Silver", "Gold"
  nextTierProgress: number; // 0-100
}

export function IncentivesScreen({
  activeQuests,
  completedQuests,
  streakDays,
  currentTier,
  nextTierProgress,
}: IncentivesScreenProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-secondary overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-background-primary px-500
        pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        border-b border-border-opaque">
        <h1 className="text-xl font-sans font-bold text-content-primary">Incentives & Quests</h1>
      </div>

      <div className="px-500 py-400 space-y-400">
        {/* Streak + Tier Banner */}
        <div className="rounded-sm bg-forest-400 text-gray-0 p-400 flex items-center gap-400">
          {/* Streak */}
          <div className="text-center">
            <span className="text-2xl font-mono font-bold block">{streakDays}</span>
            <span className="text-[9px] font-mono opacity-70 uppercase">Day streak</span>
          </div>
          <div className="w-px h-10 bg-white/20" />
          {/* Tier */}
          <div className="flex-1">
            <span className="text-label-small font-sans font-semibold block mb-200">
              {currentTier} Tier
            </span>
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${nextTierProgress}%` }}
              />
            </div>
            <span className="text-[9px] font-mono opacity-70 mt-100 block">
              {nextTierProgress}% to next tier
            </span>
          </div>
        </div>

        {/* Active Quests */}
        <div>
          <SectionHeader title={`Active quests (${activeQuests.length})`} />
          <div className="space-y-300">
            {activeQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
            {activeQuests.length === 0 && (
              <p className="text-label-small font-sans text-content-tertiary text-center py-400">
                No active quests — check back soon!
              </p>
            )}
          </div>
        </div>

        {/* Completed */}
        {completedQuests.length > 0 && (
          <div>
            <SectionHeader title={`Completed (${completedQuests.length})`} />
            <div className="space-y-200">
              {completedQuests.slice(0, 5).map((quest) => (
                <div
                  key={quest.id}
                  className="flex items-center justify-between px-400 py-300
                    rounded-sm bg-positive-50 border border-positive-400"
                >
                  <span className="text-label-small font-sans font-medium text-content-primary">{quest.title}</span>
                  <span className="text-[11px] font-mono font-bold text-content-positive">
                    +₹{quest.reward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quest Card ────────────────────────────────────────────────────────────────

function QuestCard({ quest }: { quest: Quest }) {
  const typeColors = {
    DAILY: { bg: 'bg-accent-50', border: 'border-accent-200', label: 'Daily' },
    WEEKLY: { bg: 'bg-warning-50', border: 'border-warning-400', label: 'Weekly' },
    STREAK: { bg: 'bg-positive-50', border: 'border-positive-400', label: 'Streak' },
    BONUS: { bg: 'bg-accent-50', border: 'border-accent-400', label: 'Bonus' },
  };
  const tc = typeColors[quest.type];

  return (
    <div className={`rounded-sm border ${tc.border} ${tc.bg} p-400 space-y-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-200 mb-100">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-content-tertiary">
              {tc.label}
            </span>
            <span className="text-[9px] font-mono text-content-tertiary">· {quest.deadline}</span>
          </div>
          <span className="text-label-medium font-sans font-semibold text-content-primary block">
            {quest.title}
          </span>
          <span className="text-[11px] font-sans text-content-secondary mt-100 block">
            {quest.description}
          </span>
        </div>
        <span className="flex-shrink-0 bg-background-primary border border-border-opaque rounded-sm
          px-300 py-200 text-[11px] font-mono font-bold text-accent-600">
          +₹{quest.reward}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-100">
          <span className="text-[10px] font-mono text-content-secondary">
            {quest.current}/{quest.target} {quest.unit}
          </span>
          <span className="text-[10px] font-mono font-bold text-content-primary">
            {quest.progress}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-background-primary">
          <div
            className="h-full rounded-full bg-accent-400 transition-[width] duration-500"
            style={{ width: `${quest.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
