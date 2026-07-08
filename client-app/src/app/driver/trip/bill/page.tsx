'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { FinalBill, reportCarIssue, CarIssueType, driverConfirmPayment } from '@/api/client';
import { useToastStore } from '@/store/useToastStore';
import { friendlyError } from '@/lib/ui/errorMessage';
import { FareDisplay, ClockIcon, WrenchIcon, CheckIcon, PhoneIcon, CashIcon } from '@/components/ds';

const CAR_ISSUE_TYPES: { value: CarIssueType; label: string }[] = [
  { value: 'FUEL_LOW', label: 'Fuel Low' },
  { value: 'WARNING_LIGHT', label: 'Warning Light' },
  { value: 'TYRE', label: 'Tyre' },
  { value: 'AC', label: 'AC' },
  { value: 'OTHER', label: 'Other' },
];

export default function FinalBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderID = searchParams.get('order_id') || '';
  const { token } = useAuthStore();

  const [bill, setBill] = useState<FinalBill | null>(null);
  const [missing, setMissing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase 10: post-trip car issue report
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueType, setIssueType] = useState<CarIssueType>('FUEL_LOW');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueDone, setIssueDone] = useState(false);

  const submitCarIssue = async () => {
    if (issueSubmitting) return;
    setIssueSubmitting(true);
    try {
      if (token && orderID) {
        await reportCarIssue(token, orderID, { issue_type: issueType, description: issueDesc });
      }
      setIssueDone(true);
      setShowIssueForm(false);
      setIssueDesc('');
    } catch {
      useToastStore.getState().show('Failed to report the car issue. Try again.', 'error');
    } finally {
      setIssueSubmitting(false);
    }
  };

  useEffect(() => {
    // Read from sessionStorage first
    try {
      const stored = sessionStorage.getItem(`final_bill_${orderID}`);
      if (stored) {
        setBill(JSON.parse(stored));
        return;
      }
      const general = sessionStorage.getItem('current_final_bill');
      if (general) {
        setBill(JSON.parse(general));
        return;
      }
    } catch (e) {
      console.warn('Failed reading bill from session storage:', e);
    }
    // No mock fallback: a missing bill means the trip was never really ended
    // on the backend — never show invented numbers the driver could collect.
    setMissing(true);
  }, [orderID]);

  if (!bill) {
    return (
      <div className="min-h-screen bg-background-primary text-content-primary p-6 flex items-center justify-center font-sans">
        <div className="text-center space-y-3 max-w-xs">
          {missing ? (
            <>
              <p className="text-heading-small text-content-negative">Receipt unavailable</p>
              <p className="text-paragraph-small text-content-secondary">
                This trip has no finalized bill on this device. Return to the terminal and end the trip again.
              </p>
              <button
                onClick={() => router.push('/driver')}
                className="btn-primary"
              >
                Back to terminal
              </button>
            </>
          ) : (
            <>
              <span className="flex justify-center animate-spin text-content-tertiary"><ClockIcon size={24} /></span>
              <p className="text-paragraph-small text-content-tertiary">Loading receipt…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const rows: { label: string; paise: number }[] = [
    { label: 'Base package', paise: bill.base_fare_paise },
    { label: `Extra distance (${bill.distance_km.toFixed(1)} km)`, paise: bill.distance_charge_paise },
    { label: `Waiting time (${bill.wait_minutes} min)`, paise: bill.wait_charge_paise },
    { label: `Overtime (${bill.overtime_minutes} min)`, paise: bill.overtime_charge_paise },
    { label: 'Night surcharge', paise: bill.night_surge_paise },
    { label: 'Tolls', paise: bill.tolls_paise },
    { label: 'Parking / stops', paise: bill.parking_charges_paise },
    { label: 'Vahnly Care', paise: bill.care_surcharge_paise },
  ];

  const handleMarkPaid = async () => {
    if (!paymentMethod || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (token && orderID) {
        await driverConfirmPayment(token, orderID, {
          payment_method: paymentMethod,
          rider_rating: 0,
          tags: [],
        });
      }
      try {
        sessionStorage.setItem(`payment_method_${orderID}`, paymentMethod);
      } catch {}
      router.push(`/driver/trip/rate?order_id=${orderID}`);
    } catch (err) {
      useToastStore.getState().show(friendlyError(err), 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-content-primary p-4 sm:p-6 font-sans flex flex-col">
      <header className="pb-5 mb-5 border-b border-border-opaque">
        <h1 className="text-display-serif text-[28px]">Trip receipt</h1>
        <p className="font-mono text-mono-small text-content-tertiary mt-1">
          Order {orderID.substring(0, 18)}…
        </p>
      </header>

      <main className="flex-grow max-w-md mx-auto w-full space-y-4">
        {/* Total — forest hero tile, mirrors the dashboard earnings tile */}
        <div className="rounded-md bg-forest-400 text-white p-5 flex items-end justify-between">
          <div>
            <span className="text-label-small text-accent-200 block mb-1.5">Total amount due</span>
            <span className="font-mono text-[32px] leading-none font-medium tabular-nums">
              ₹{(bill.total_fare_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono text-mono-medium tabular-nums block">
              ₹{(bill.driver_payout_paise / 100).toLocaleString('en-IN')}
            </span>
            <span className="text-label-small text-accent-200">your payout</span>
          </div>
        </div>

        {/* Itemized breakdown */}
        <div className="card space-y-2.5">
          <span className="text-label-medium text-content-secondary block border-b border-border-opaque pb-2">
            Itemized breakdown
          </span>
          {rows.filter((r) => r.paise > 0).map((r) => (
            <div key={r.label} className="flex justify-between items-center">
              <span className="text-paragraph-medium text-content-secondary">{r.label}</span>
              <FareDisplay amount={r.paise} size="sm" />
            </div>
          ))}
          <div className="border-t border-border-opaque pt-2.5 flex justify-between items-center">
            <span className="text-label-large">Total</span>
            <FareDisplay amount={bill.total_fare_paise} size="md" className="font-semibold" />
          </div>
        </div>

        {/* Report car issue */}
        <div className="card">
          {!showIssueForm && !issueDone && (
            <button
              onClick={() => setShowIssueForm(true)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-sm border border-border-opaque bg-surface-warning
                text-label-medium text-content-warning hover:opacity-90 transition-base cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <WrenchIcon size={16} /> Report car issue
            </button>
          )}
          {issueDone && (
            <p className="flex items-center justify-center gap-1.5 text-label-medium text-content-positive">
              <CheckIcon size={16} /> Car issue reported — admin notified
            </p>
          )}
          {showIssueForm && (
            <div className="space-y-3">
              <span className="text-label-medium text-content-warning block">Report car issue</span>
              <div className="grid grid-cols-3 gap-2">
                {CAR_ISSUE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setIssueType(t.value)}
                    className={`h-10 rounded-sm text-label-small border transition-base cursor-pointer ${
                      issueType === t.value
                        ? 'bg-surface-warning border-warning-400 text-content-warning font-semibold'
                        : 'bg-background-secondary border-border-opaque text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder="Describe the issue (optional)"
                rows={2}
                className="input h-auto py-2.5 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowIssueForm(false)}
                  className="h-10 px-4 rounded-sm bg-background-secondary border border-border-opaque text-label-medium text-content-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCarIssue}
                  disabled={issueSubmitting}
                  className="h-10 px-4 rounded-sm bg-warning-400 text-gray-1000 text-label-medium font-semibold cursor-pointer disabled:opacity-50"
                >
                  {issueSubmitting ? 'Filing…' : 'Submit report'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="space-y-2.5">
          <span className="text-label-medium text-content-secondary block">How did the rider pay?</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('UPI')}
              className={`h-20 rounded-md border transition-base cursor-pointer flex flex-col items-center justify-center gap-1.5 text-label-medium ${
                paymentMethod === 'UPI'
                  ? 'bg-accent-50 border-forest-400 border-2 text-content-primary font-semibold'
                  : 'bg-background-primary border-border-opaque text-content-secondary hover:text-content-primary'
              }`}
            >
              <PhoneIcon size={20} />
              <span>UPI / QR code</span>
            </button>
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`h-20 rounded-md border transition-base cursor-pointer flex flex-col items-center justify-center gap-1.5 text-label-medium ${
                paymentMethod === 'CASH'
                  ? 'bg-accent-50 border-forest-400 border-2 text-content-primary font-semibold'
                  : 'bg-background-primary border-border-opaque text-content-secondary hover:text-content-primary'
              }`}
            >
              <CashIcon size={20} />
              <span>Cash</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-6 max-w-md mx-auto w-full pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={handleMarkPaid}
          disabled={!paymentMethod || isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Confirming payment…' : 'Confirm payment & rate rider'}
        </button>
      </footer>
    </div>
  );
}
