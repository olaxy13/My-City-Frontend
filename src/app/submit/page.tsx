'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useCity } from '@/context/CityContext';
import { api } from '@/lib/api-client';
import type { Category, CreateSubmissionInput } from '@/types/api';
import {
  DEFAULT_CITY,
  buildPayload,
  createEmptyForm,
  getSteps,
  validateStep,
  type FormUpdater,
} from '@/components/submit/submission';
import { useBankAccountResolver, useSubmissionDraft } from '@/components/submit/hooks';
import { ErrorBanner } from '@/components/submit/ui';
import StepIndicator from '@/components/submit/StepIndicator';
import DraftBanner from '@/components/submit/DraftBanner';
import SubmissionSuccess from '@/components/submit/SubmissionSuccess';
import GeneralStep from '@/components/submit/GeneralStep';
import PhotosStep from '@/components/submit/PhotosStep';
import DetailsStep from '@/components/submit/DetailsStep';
import TicketsStep from '@/components/submit/TicketsStep';
import LegalStep from '@/components/submit/LegalStep';
import SubmitterStep from '@/components/submit/SubmitterStep';

export default function SubmitListingPage() {
  const { currentCity, setCurrentCity, cities, getNeighborhoodsForCity } = useCity();

  const [formData, setFormData] = useState<CreateSubmissionInput>(() =>
    createEmptyForm(currentCity || DEFAULT_CITY)
  );
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ id: string; editToken: string } | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  /** True once the user has changed anything; only then is a draft saved. */
  const [dirty, setDirty] = useState(false);

  /** Once the user picks a city here (or a draft is restored), stop following the site-wide city. */
  const [cityPinned, setCityPinned] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);

  // The form as shown, validated and submitted: the city follows the site-wide
  // choice until pinned, and the neighborhood always belongs to that city.
  const city = (cityPinned ? formData.city : currentCity) || formData.city || DEFAULT_CITY;
  const { form, neighborhoods } = useMemo(() => {
    const list = getNeighborhoodsForCity(city);
    const neighborhood = list.includes(formData.neighborhood) ? formData.neighborhood : list[0] || '';
    return { form: { ...formData, city, neighborhood }, neighborhoods: list };
    // getNeighborhoodsForCity is derived from `cities`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, city, cities]);

  const steps = getSteps(form.listingType);
  const stepIndex = Math.min(step, steps.length) - 1;
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isEvent = form.listingType === 'event';

  const update: FormUpdater = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage('');
    setDirty(true);
  };

  const clearDraft = useSubmissionDraft(form, step, dirty, (draft, savedStep) => {
    setCityPinned(true);
    setDirty(true);
    setFormData(draft);
    setStep(Math.min(Math.max(savedStep, 1), getSteps(draft.listingType).length));
    setShowResumeBanner(true);
  });

  const bank = useBankAccountResolver(isEvent, form, setFormData);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Bring the top of the wizard into view when moving between steps
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current !== step) {
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      previousStep.current = step;
    }
  }, [step]);

  const handleCityChange = (selected: string) => {
    setCityPinned(true);
    update('city', selected);
    setCurrentCity(selected);
  };

  const startFresh = () => {
    clearDraft();
    setCityPinned(false);
    setDirty(false);
    setFormData(createEmptyForm(currentCity || DEFAULT_CITY));
    setStep(1);
    setErrorMessage('');
    setShowResumeBanner(false);
  };

  const handleNext = () => {
    const error = validateStep(currentStep.key, form);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage('');
    setStep(stepIndex + 2);
  };

  const handleBack = () => {
    setErrorMessage('');
    setStep(stepIndex);
  };

  const handleSubmit = async () => {
    // Re-check every step: a restored draft may skip earlier validation
    for (let i = 0; i < steps.length; i++) {
      const error = validateStep(steps[i].key, form);
      if (error) {
        setStep(i + 1);
        setErrorMessage(error);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.createSubmission(buildPayload(form));
      clearDraft();
      setSuccessResult({ id: res.id, editToken: res.editToken });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage((err as Error)?.message || 'Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const props = { form, update };
    switch (currentStep.key) {
      case 'general':
        return (
          <GeneralStep
            {...props}
            categories={categories}
            cities={cities}
            neighborhoods={neighborhoods}
            onCityChange={handleCityChange}
          />
        );
      case 'photos':
        return <PhotosStep {...props} onError={setErrorMessage} />;
      case 'details':
        return <DetailsStep {...props} />;
      case 'tickets':
        return (
          <TicketsStep
            {...props}
            banks={bank.banks}
            isResolvingAccount={bank.isResolving}
            accountResolveError={bank.resolveError}
          />
        );
      case 'legal':
        return <LegalStep {...props} stepNumber={stepIndex + 1} />;
      case 'submitter':
        return <SubmitterStep {...props} stepNumber={stepIndex + 1} />;
    }
  };

  return (
    <div className="container" style={{ maxWidth: '820px', paddingTop: '40px', paddingBottom: '100px' }}>
      <header style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div className="badge badge-featured" style={{ marginBottom: '10px' }}>
          <Sparkles size={12} aria-hidden />
          100% FREE COMMUNITY SUBMISSION
        </div>
        <h1 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '8px' }}>Submit a Listing to City Discovery</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Reach thousands of people looking for events, dining, and places in {city}.
        </p>
      </header>

      {showResumeBanner && !successResult && (
        <DraftBanner onStartFresh={startFresh} onContinue={() => setShowResumeBanner(false)} />
      )}

      {successResult ? (
        <SubmissionSuccess id={successResult.id} editToken={successResult.editToken} email={form.submitterEmail} />
      ) : (
        <div
          ref={wizardRef}
          className="glass-card-static submit-wizard-card"
          style={{ padding: '36px 30px', borderRadius: 'var(--radius-xl)', scrollMarginTop: '90px' }}
        >
          <StepIndicator steps={steps} current={stepIndex + 1} />

          {errorMessage && <ErrorBanner message={errorMessage} />}

          {renderStep()}

          <nav
            aria-label="Form steps"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '36px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {stepIndex > 0 ? (
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                <ChevronLeft size={16} aria-hidden />
                <span>Back</span>
              </button>
            ) : (
              <span />
            )}

            {!isLastStep ? (
              <button type="button" onClick={handleNext} className="btn btn-primary">
                <span>Continue</span>
                <ChevronRight size={16} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '12px 28px' }}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="glow-animation" aria-hidden />
                ) : (
                  <Sparkles size={18} aria-hidden />
                )}
                <span>{isSubmitting ? 'Submitting Listing...' : 'Submit Listing For Review'}</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
