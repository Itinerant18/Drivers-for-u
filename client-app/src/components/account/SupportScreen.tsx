'use client';

import React, { useState } from 'react';

// ─── Support & Help Screen ─────────────────────────────────────────────────────
// FAQ accordion + contact options + active tickets.

interface FAQ {
  question: string;
  answer: string;
}

interface SupportScreenProps {
  faqs: FAQ[];
  supportPhone: string;
  supportEmail: string;
  activeTickets: { id: string; subject: string; status: string; date: string }[];
  onNewTicket: () => void;
  onCallSupport: () => void;
  onEmailSupport: () => void;
}

export function SupportScreen({
  faqs,
  supportPhone,
  supportEmail,
  activeTickets,
  onNewTicket,
  onCallSupport,
  onEmailSupport,
}: SupportScreenProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background-secondary overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-background-primary px-500
        pt-[calc(var(--space-500)+env(safe-area-inset-top,0px))] pb-400
        border-b border-border-opaque">
        <h1 className="text-xl font-sans font-bold text-content-primary">Help & Support</h1>
      </div>

      <div className="px-500 py-400 space-y-400">
        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-300">
          <button
            type="button"
            onClick={onCallSupport}
            className="flex flex-col items-center gap-200 p-400 rounded-sm
              border border-border-opaque bg-background-primary
              hover:border-accent-200 transition-base cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-500">
              <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.08 5.18 2 2 0 015.08 3h3a2 2 0 012 1.72c.13 1 .36 1.97.7 2.9a2 2 0 01-.45 2.11L9.09 11a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.34 1.9.57 2.9.7a2 2 0 011.72 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-sans font-semibold text-content-primary">Call us</span>
          </button>
          <button
            type="button"
            onClick={onEmailSupport}
            className="flex flex-col items-center gap-200 p-400 rounded-sm
              border border-border-opaque bg-background-primary
              hover:border-accent-200 transition-base cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-500">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-sans font-semibold text-content-primary">Email</span>
          </button>
        </div>

        {/* New ticket */}
        <button
          type="button"
          onClick={onNewTicket}
          className="w-full h-11 rounded-sm bg-accent-400 hover:bg-accent-500
            text-gray-0 text-label-small font-sans font-bold
            active:scale-[0.98] transition-base cursor-pointer
            flex items-center justify-center gap-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Raise a support ticket
        </button>

        {/* Active tickets */}
        {activeTickets.length > 0 && (
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-200">
              Active tickets
            </span>
            <div className="space-y-200">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between px-400 py-300
                  rounded-sm border border-border-opaque bg-background-primary">
                  <div>
                    <span className="text-label-small font-sans font-medium text-content-primary block">{ticket.subject}</span>
                    <span className="text-[10px] font-mono text-content-tertiary">{ticket.date} · #{ticket.id.slice(0, 8)}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase text-content-warning bg-warning-50 px-200 py-100 rounded-sm">
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-content-tertiary block mb-200">
            Frequently asked questions
          </span>
          <div className="rounded-sm border border-border-opaque bg-background-primary divide-y divide-border-opaque overflow-hidden">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-400 py-350 flex items-center justify-between
                    hover:bg-gray-50 transition-base cursor-pointer"
                >
                  <span className="text-label-small font-sans font-medium text-content-primary flex-1 mr-300">
                    {faq.question}
                  </span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    className={`text-content-tertiary transition-transform duration-200 flex-shrink-0
                      ${openFaq === i ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-400 pb-350 text-[12px] font-sans text-content-secondary animate-enter">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
