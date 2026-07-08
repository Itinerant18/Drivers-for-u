'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { useDriverDutyStore } from '@/store/useDriverDutyStore';
import { rateRider } from '@/api/client';
import { useToastStore } from '@/store/useToastStore';
import { friendlyError } from '@/lib/ui/errorMessage';
import { CheckIcon } from '@/components/ds';
import { StarIcon } from '@/components/ds/Icon';

export default function RateRiderPage() {
  const t = useTranslations('driverTripRate');
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderID = searchParams.get('order_id') || '';
  const { token } = useAuthStore();
  const { setDutyState } = useDriverDutyStore();

  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const positiveTags: { value: string; labelKey: string }[] = [
    { value: 'On-time', labelKey: 'tagOnTime' },
    { value: 'Polite', labelKey: 'tagPolite' },
    { value: 'Easy to deal with', labelKey: 'tagEasy' },
  ];
  const negativeTags: { value: string; labelKey: string }[] = [
    { value: 'Rude', labelKey: 'tagRude' },
    { value: 'Late', labelKey: 'tagLate' },
    { value: 'Car in bad condition', labelKey: 'tagBadCondition' },
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (token && orderID) {
        await rateRider(token, orderID, {
          rating,
          tags: selectedTags,
          comment: comment.trim(),
        });
      }
      try {
        sessionStorage.removeItem(`final_bill_${orderID}`);
        sessionStorage.removeItem('current_final_bill');
      } catch {}
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to rate rider:', err);
      useToastStore.getState().show(friendlyError(err), 'error');
      // Even on failure, advance to the next-step choice — the trip is over.
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goOnline = () => {
    setDutyState('ONLINE');
    router.push('/driver');
  };

  const takeBreak = () => {
    setDutyState('OFFLINE');
    router.push('/driver');
  };

  // Tags shown depend on the score: positive set for 4-5★, negative set for 1-3★.
  const activeTagSet = rating >= 4 ? positiveTags : negativeTags;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background-primary text-content-primary p-4 sm:p-6 font-sans flex flex-col justify-center">
        <main className="max-w-md mx-auto w-full space-y-8 text-center">
          <div className="space-y-3">
            <span className="mx-auto h-14 w-14 rounded-pill bg-accent-50 text-content-positive flex items-center justify-center">
              <CheckIcon size={28} />
            </span>
            <h1 className="text-display-serif text-[26px]">{t('thanksTitle')}</h1>
            <p className="text-paragraph-medium text-content-secondary">{t('nextPrompt')}</p>
          </div>

          <div className="space-y-2.5">
            <button onClick={goOnline} className="btn-primary">
              {t('goOnline')}
            </button>
            <button
              onClick={takeBreak}
              className="w-full h-14 rounded-sm bg-background-primary border border-border-opaque
                text-label-large text-content-secondary hover:text-content-primary
                transition-base cursor-pointer active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              {t('takeBreak')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-content-primary p-4 sm:p-6 font-sans flex flex-col">
      <header className="pb-5 mb-5 border-b border-border-opaque">
        <h1 className="text-display-serif text-[28px]">{t('title')}</h1>
        <p className="font-mono text-mono-small text-content-tertiary mt-1">
          {t('orderId', { id: orderID.substring(0, 18) })}
        </p>
      </header>

      <main className="flex-grow max-w-md mx-auto w-full space-y-4">
        {/* Star rating */}
        <div className="card text-center space-y-4">
          <span className="text-label-medium text-content-secondary block">
            {t('riderScoreRating')}
          </span>
          <div className="flex justify-center gap-2 select-none">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-base hover:scale-110 active:scale-95 cursor-pointer ${
                  star <= rating ? 'text-warning-400' : 'text-gray-300'
                }`}
              >
                <StarIcon size={32} className="fill-current" />
              </button>
            ))}
          </div>
          <span className="text-paragraph-small text-content-secondary block">
            {rating === 5 && t('rating5')}
            {rating === 4 && t('rating4')}
            {rating === 3 && t('rating3')}
            {rating === 2 && t('rating2')}
            {rating === 1 && t('rating1')}
          </span>
        </div>

        {/* Quick-tap feedback tags */}
        <div className="card space-y-3">
          <span className="text-label-medium text-content-secondary block border-b border-border-opaque pb-2">
            {t('addQuickFeedbackTags')}
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {activeTagSet.map((tag) => {
              const active = selectedTags.includes(tag.value);
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-4 py-2 rounded-pill border text-label-medium transition-base cursor-pointer min-h-[36px] ${
                    active
                      ? 'bg-interactive-primary border-interactive-primary text-interactive-primary-text'
                      : 'bg-background-secondary border-border-opaque text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {t(tag.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Free-text comment */}
        <div className="card space-y-2.5">
          <span className="text-label-medium text-content-secondary block">
            {t('commentLabel')}
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t('commentPlaceholder')}
            className="input h-auto py-3 resize-none"
          />
        </div>
      </main>

      <footer className="mt-6 max-w-md mx-auto w-full pb-[env(safe-area-inset-bottom)]">
        <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? t('submitting') : t('submitButton')}
        </button>
      </footer>
    </div>
  );
}
