'use client';

import React from 'react';
import { StatusBadge, EmptyState, SectionHeader } from '@/components/ds/redesign';

// ─── Vehicle Records Screen ────────────────────────────────────────────────────
// List of vehicles registered by the driver. 
// Cards with status badges (Active/Pending/Expired docs).

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  type: string; // Hatchback, Sedan, SUV
  transmission: string;
  fuel: string;
  year: number;
  isActive: boolean;
  documentsStatus: 'OK' | 'EXPIRING' | 'EXPIRED';
  expiryInfo?: string; // e.g. "Insurance expires in 5 days"
}

interface VehiclesScreenProps {
  vehicles: Vehicle[];
  onAddVehicle: () => void;
  onEditVehicle: (id: string) => void;
  onViewDocuments: (id: string) => void;
}

export function VehiclesScreen({
  vehicles,
  onAddVehicle,
  onEditVehicle,
  onViewDocuments,
}: VehiclesScreenProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-secondary">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-background-primary px-500
        pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        border-b border-border-opaque flex items-center justify-between">
        <h1 className="text-xl font-sans font-bold text-content-primary">Vehicles</h1>
        <button
          type="button"
          onClick={onAddVehicle}
          className="flex items-center gap-200 px-300 py-200 rounded-sm
            bg-accent-400 text-gray-0 text-[11px] font-sans font-bold
            hover:bg-accent-500 active:scale-95 transition-base cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add
        </button>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-500 py-400 space-y-300">
        {vehicles.length === 0 && (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 17h14M7 11l1.5-4h7L17 11M6 17V11h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="15.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            }
            title="No vehicles registered"
            description="Add your first vehicle to start receiving job offers"
          />
        )}

        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onEdit={() => onEditVehicle(vehicle.id)}
            onDocs={() => onViewDocuments(vehicle.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Vehicle Card ──────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  onEdit,
  onDocs,
}: {
  vehicle: Vehicle;
  onEdit: () => void;
  onDocs: () => void;
}) {
  const docVariant = vehicle.documentsStatus === 'OK' ? 'positive'
    : vehicle.documentsStatus === 'EXPIRING' ? 'warning' : 'negative';

  return (
    <div className="rounded-sm border border-border-opaque bg-background-primary overflow-hidden">
      {/* Header */}
      <div className="px-400 py-350 flex items-center gap-300">
        <div className="w-10 h-10 rounded-sm bg-accent-50 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-500">
            <path d="M5 17h14M7 11l1.5-4h7L17 11M6 17V11h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="15.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-label-medium font-sans font-semibold text-content-primary block truncate">
            {vehicle.make} {vehicle.model}
          </span>
          <span className="text-[11px] font-mono text-content-secondary">
            {vehicle.plate} · {vehicle.type} · {vehicle.transmission}
          </span>
        </div>
        {vehicle.isActive && <StatusBadge label="Active" variant="positive" />}
      </div>

      {/* Details strip */}
      <div className="px-400 py-200 bg-gray-50 flex items-center gap-300 text-[10px] font-mono text-content-tertiary">
        <span>{vehicle.fuel}</span>
        <span>·</span>
        <span>{vehicle.year}</span>
        <span>·</span>
        <StatusBadge
          label={vehicle.documentsStatus === 'OK' ? 'Docs OK' : vehicle.documentsStatus === 'EXPIRING' ? 'Expiring' : 'Expired'}
          variant={docVariant}
        />
      </div>

      {/* Expiry warning */}
      {vehicle.expiryInfo && (
        <div className="px-400 py-200 bg-warning-50 text-[11px] font-sans text-content-warning flex items-center gap-200">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {vehicle.expiryInfo}
        </div>
      )}

      {/* Actions */}
      <div className="px-400 py-300 flex items-center gap-200 border-t border-border-opaque">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 h-9 rounded-sm border border-border-opaque
            text-[11px] font-sans font-semibold text-content-secondary
            hover:bg-gray-50 transition-base cursor-pointer"
        >
          Edit details
        </button>
        <button
          type="button"
          onClick={onDocs}
          className="flex-1 h-9 rounded-sm border border-border-opaque
            text-[11px] font-sans font-semibold text-content-secondary
            hover:bg-gray-50 transition-base cursor-pointer"
        >
          Documents
        </button>
      </div>
    </div>
  );
}
