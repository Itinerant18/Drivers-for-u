'use client';

import React from 'react';

// ─── Design System Shared Components ───────────────────────────────────────────
// Atomic components used across multiple screens.
// All follow Aura tokens — no hardcoded values.

// ─── FareDisplay ────────────────────────────────────────────────────────────────
// Renders a currency amount with proper font (JetBrains Mono for digits,
// Playfair Display for the "hero" size variant).

interface FareDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FareDisplay({ amount, size = 'md', className = '' }: FareDisplayProps) {
  const formatted = `₹${amount.toLocaleString('en-IN')}`;
  const sizeClasses = {
    sm: 'text-sm font-mono font-bold',
    md: 'text-lg font-mono font-bold',
    lg: 'text-[36px] font-serif font-semibold',
  };
  return <span className={`${sizeClasses[size]} tabular-nums ${className}`}>{formatted}</span>;
}

// ─── StatusBadge ────────────────────────────────────────────────────────────────

type BadgeVariant = 'positive' | 'warning' | 'negative' | 'accent' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  const config: Record<BadgeVariant, string> = {
    positive: 'bg-positive-50 text-content-positive border-positive-400',
    warning: 'bg-warning-50 text-content-warning border-warning-400',
    negative: 'bg-negative-50 text-content-negative border-negative-400',
    accent: 'bg-accent-50 text-accent-600 border-accent-400',
    neutral: 'bg-gray-50 text-content-secondary border-border-opaque',
  };
  return (
    <span className={`inline-flex items-center px-200 py-100 rounded-sm border
      text-[9px] font-mono font-bold uppercase tracking-wider ${config[variant]}`}>
      {label}
    </span>
  );
}

// ─── IconButton ─────────────────────────────────────────────────────────────────

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
}: IconButtonProps) {
  const baseClass = 'inline-flex items-center justify-center rounded-full transition-base cursor-pointer active:scale-95';
  const sizeClass = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const variantClass = {
    primary: 'bg-accent-400 text-gray-0 hover:bg-accent-500',
    secondary: 'bg-accent-50 border border-accent-200 text-accent-500 hover:bg-accent-100',
    ghost: 'text-content-secondary hover:bg-gray-50',
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${baseClass} ${sizeClass} ${variantClass} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {icon}
    </button>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────────

export function SectionHeader({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between mb-300">
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary">
        {title}
      </span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-[11px] font-sans font-semibold text-accent-500 hover:text-accent-600 cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-900 px-500">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-400 text-content-tertiary">
        {icon}
      </div>
      <h3 className="text-label-medium font-sans font-semibold text-content-primary mb-200">{title}</h3>
      <p className="text-paragraph-small text-content-secondary">{description}</p>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-sm animate-pulse ${className}`} />;
}

// ─── Divider ────────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="flex items-center gap-300 py-300">
        <div className="flex-1 h-px bg-border-opaque" />
        <span className="text-[9px] font-mono text-content-tertiary uppercase">{label}</span>
        <div className="flex-1 h-px bg-border-opaque" />
      </div>
    );
  }
  return <div className="h-px bg-border-opaque my-300" />;
}

// ─── BottomSheet (reusable) ─────────────────────────────────────────────────────

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-enter" />
      {/* Sheet */}
      <div
        className="relative w-full bg-background-primary rounded-t-lg
          pb-[calc(var(--space-500)+env(safe-area-inset-bottom,0px))]
          animate-enter max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sticky top-0 bg-background-primary pt-300 pb-400 px-500 border-b border-border-opaque">
          <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-300" />
          {title && (
            <h3 className="text-label-large font-sans font-semibold text-content-primary">{title}</h3>
          )}
        </div>
        <div className="px-500 pt-400">
          {children}
        </div>
      </div>
    </div>
  );
}
