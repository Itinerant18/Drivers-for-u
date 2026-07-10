'use client';

import React, { useState } from 'react';
import { useSafetyStore } from '@/store/useSafetyStore';

// ─── Floating SOS Button ───────────────────────────────────────────────────────
// Always visible during active jobs (EN_ROUTE, ARRIVED, DELIVERING).
// Single tap → confirm dialog (NOT hold — too slow in emergencies).
// 48×48px circle, negative color, fixed bottom-right.

export function SosFloatingButton({ orderId }: { orderId?: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { triggerSOS } = useSafetyStore();

  const handleTrigger = () => {
    setShowConfirm(false);
    // Fire immediately with last-known/zero coords if GPS is slow — the alert
    // must not wait on a location fix.
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => void triggerSOS(pos.coords.latitude, pos.coords.longitude, orderId),
        () => void triggerSOS(0, 0, orderId),
        { timeout: 3000, maximumAge: 60000 },
      );
    } else {
      void triggerSOS(0, 0, orderId);
    }
    // Continuous vibrate until acknowledged
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([500, 200, 500, 200, 500, 200, 500]); } catch { /* */ }
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        aria-label="Emergency SOS"
        // ponytail: fixed offset clears the tallest bottom CTA stack (delivering);
        // per-screen anchoring if a future screen grows a taller stack
        className="fixed bottom-56 right-4 z-30 w-12 h-12 rounded-full
          bg-negative-400 hover:bg-negative-500 active:scale-90
          flex items-center justify-center text-gray-0
          shadow-[0_4px_12px_rgba(201,64,48,0.4)]
          transition-all duration-200 cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-500 animate-enter">
          <div className="bg-background-primary rounded-md p-600 max-w-sm w-full space-y-500 text-center">
            <div className="w-16 h-16 rounded-full bg-negative-50 border-2 border-negative-400
              flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-content-negative">
                <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-sans font-bold text-content-primary">
              Trigger Emergency SOS?
            </h3>
            <p className="text-paragraph-small text-content-secondary">
              This will share your live location with your emergency contact and alert our safety team.
            </p>
            <div className="flex gap-300">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-12 rounded-sm border border-border-opaque
                  text-label-medium font-sans font-semibold text-content-secondary
                  hover:bg-gray-50 transition-base cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTrigger}
                className="flex-1 h-12 rounded-sm bg-negative-400 hover:bg-negative-500
                  text-gray-0 text-label-medium font-sans font-bold
                  active:scale-[0.98] transition-base cursor-pointer"
              >
                YES, TRIGGER SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
