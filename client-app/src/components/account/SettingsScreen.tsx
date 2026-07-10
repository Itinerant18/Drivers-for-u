'use client';

import React from 'react';

// ─── App Settings Screen ───────────────────────────────────────────────────────
// System preferences: theme, language, notifications, GPS, data usage.

interface SettingsScreenProps {
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    soundAlerts: boolean;
    vibration: boolean;
    highAccuracyGps: boolean;
    dataUsage: 'LOW' | 'NORMAL' | 'HIGH';
    autoAccept: boolean;
  };
  onToggle: (key: string, value: boolean) => void;
  onSelect: (key: string, value: string) => void;
  onDeleteAccount: () => void;
}

export function SettingsScreen({ settings, onToggle, onSelect, onDeleteAccount }: SettingsScreenProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-secondary overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-background-primary px-500
        pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        border-b border-border-opaque">
        <h1 className="text-xl font-sans font-bold text-content-primary">Settings</h1>
      </div>

      <div className="px-500 py-400 space-y-400">
        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsSelect
            label="Theme"
            value={settings.theme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            onChange={(v) => onSelect('theme', v)}
          />
          <SettingsSelect
            label="Language"
            value={settings.language}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिन्दी' },
              { value: 'bn', label: 'বাংলা' },
            ]}
            onChange={(v) => onSelect('language', v)}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Alerts">
          <SettingsToggle
            label="Push notifications"
            description="Job offers, payments, updates"
            value={settings.notifications}
            onChange={(v) => onToggle('notifications', v)}
          />
          <SettingsToggle
            label="Sound alerts"
            description="Beep on incoming offers"
            value={settings.soundAlerts}
            onChange={(v) => onToggle('soundAlerts', v)}
          />
          <SettingsToggle
            label="Vibration"
            description="Haptic feedback on offers"
            value={settings.vibration}
            onChange={(v) => onToggle('vibration', v)}
          />
        </SettingsSection>

        {/* GPS & Data */}
        <SettingsSection title="GPS & Data">
          <SettingsToggle
            label="High-accuracy GPS"
            description="Uses more battery, better location"
            value={settings.highAccuracyGps}
            onChange={(v) => onToggle('highAccuracyGps', v)}
          />
          <SettingsSelect
            label="Map data usage"
            value={settings.dataUsage}
            options={[
              { value: 'LOW', label: 'Low (basic tiles)' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'HIGH', label: 'High (satellite)' },
            ]}
            onChange={(v) => onSelect('dataUsage', v)}
          />
        </SettingsSection>

        {/* Job preferences */}
        <SettingsSection title="Job Preferences">
          <SettingsToggle
            label="Auto-accept offers"
            description="Automatically accept matching jobs (experimental)"
            value={settings.autoAccept}
            onChange={(v) => onToggle('autoAccept', v)}
          />
        </SettingsSection>

        {/* Danger zone */}
        <div className="pt-400">
          <button
            type="button"
            onClick={onDeleteAccount}
            className="w-full h-11 rounded-sm border border-negative-400 bg-negative-50
              text-content-negative text-label-small font-sans font-semibold
              hover:bg-negative-100 active:scale-[0.98] transition-base cursor-pointer"
          >
            Delete my account
          </button>
          <p className="text-[10px] font-sans text-content-tertiary text-center mt-200">
            This action is irreversible. All data will be permanently deleted.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-200 px-100">
        {title}
      </span>
      <div className="rounded-sm border border-border-opaque bg-background-primary divide-y divide-border-opaque overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-400 py-350">
      <div className="flex-1 min-w-0 mr-300">
        <span className="text-label-small font-sans font-medium text-content-primary block">{label}</span>
        {description && (
          <span className="text-[10px] font-sans text-content-tertiary">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-pill transition-base cursor-pointer flex-shrink-0
          ${value ? 'bg-accent-400' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-gray-0 shadow-sm transition-transform duration-200
            ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

function SettingsSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-400 py-350">
      <span className="text-label-small font-sans font-medium text-content-primary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[11px] font-mono text-content-secondary bg-gray-50
          border border-border-opaque rounded-sm px-200 py-100 cursor-pointer
          focus:outline-none focus:ring-1 focus:ring-accent-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
