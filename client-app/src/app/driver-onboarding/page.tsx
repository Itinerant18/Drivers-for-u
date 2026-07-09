'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverOnboardingStore } from '@/store/useDriverOnboardingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { saveOnboardingStep, uploadDocumentPresigned, syncOfflineOnboarding, updateDriverProfile } from '@/api/client';
import { useToastStore } from '@/store/useToastStore';
import { AnimatedIcon } from '@/components/ds/Icon';
import { AnimSettings, AnimCar, AnimCheck } from '@/assets/icons/animated';

export default function DriverOnboardingWizard() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { step: currentStep, data: onboardingStoreData, updateData, setStep, clearStore } = useDriverOnboardingStore();
  
  const [logs, setLogs] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);

  // IFSC resolution (Razorpay free public lookup). 'verified' shows BANK — BRANCH,
  // 'error' shows a subtle hint. Never blocks form submit.
  const [ifscLookup, setIfscLookup] = useState<{
    status: 'idle' | 'loading' | 'verified' | 'error';
    label: string;
  }>({ status: 'idle', label: '' });

  const handleIfscBlur = async (code: string) => {
    const ifsc = code.trim().toUpperCase();
    if (ifsc.length !== 11) {
      setIfscLookup({ status: 'idle', label: '' });
      return;
    }
    setIfscLookup({ status: 'loading', label: '' });
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (!res.ok) {
        setIfscLookup({ status: 'error', label: '' });
        return;
      }
      const data = await res.json();
      const label = data.BANK ? `${data.BANK} — ${data.BRANCH}` : '';
      setIfscLookup({ status: 'verified', label });
      // Persist the resolved bank name so the payout step has it on record.
      setOnboardingData({ ifscBankName: label });
    } catch {
      setIfscLookup({ status: 'error', label: '' });
    }
  };

  // Hidden file input references for KYC document uploading
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadField, setActiveUploadField] = useState<{ fieldName: string; docType: string } | null>(null);

  const defaultData = {
    fullName: '',
    dob: '',
    gender: 'Male',
    profilePhoto: null as string | null,
    languages: [] as string[],
    permAddress: '',
    currAddress: '',
    city: 'Kolkata',
    drivingLicense: null as string | null,
    aadhaarId: null as string | null,
    panCard: null as string | null,
    policeVerification: null as string | null,
    addressProof: null as string | null,
    manualExpertise: true,
    automaticExpertise: true,
    yearsOfExperience: '5',
    accountNo: '',
    ifscCode: '',
    holderName: '',
    upiId: '',
    cancelledCheque: null as string | null,
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    signatureName: '',
    agreedToTerms: false,
  };

  const onboardingData = { ...defaultData, ...onboardingStoreData };

  const setOnboardingData = (updater: any) => {
    if (typeof updater === 'object' && updater !== null) {
      updateData(updater);
    } else if (typeof updater === 'function') {
      updateData(updater(onboardingData));
    }
  };

  useEffect(() => {
    if (!token) {
      useToastStore.getState().show('Log in to continue driver onboarding.', 'error');
      router.push('/login?role=driver');
      return;
    }

    // Attempt to sync any cached offline payloads
    void syncOfflineOnboarding();
  }, [token, router]);

  // Helper log function
  const logEvent = (action: string, meta: any) => {
    const time = new Date().toISOString();
    const str = `[ONBOARDING_LOG] ${time} | ${action} | Meta: ${JSON.stringify(meta)}`;
    console.log(str);
    setLogs((prev) => [str, ...prev]);
  };

  const triggerUploadClick = (fieldName: string, docType: string) => {
    setActiveUploadField({ fieldName, docType });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadField) return;
    const { fieldName, docType } = activeUploadField;

    if (!token) {
      useToastStore.getState().show('Session expired. Please log in again.', 'error');
      router.push('/login?role=driver');
      return;
    }

    logEvent('UPLOAD_START', { fieldName, docType, fileName: file.name });
    setUploadProgress((prev) => ({ ...prev, [fieldName]: 1 }));

    try {
      // Real byte progress via presigned PUT (falls back to the server-proxied
      // upload with an indeterminate 10 → 100 jump inside the client helper).
      const storageUrl = await uploadDocumentPresigned(token, docType, file, (pct) => {
        setUploadProgress((prev) => ({ ...prev, [fieldName]: Math.max(1, pct) }));
      });
      setUploadProgress((prev) => ({ ...prev, [fieldName]: 100 }));

      updateData({ [fieldName]: storageUrl });
      logEvent('UPLOAD_COMPLETE', { fieldName, docType, storage_url: storageUrl });
    } catch (err) {
      logEvent('UPLOAD_ERROR', { fieldName, docType, error: String(err) });
      useToastStore.getState().show('Failed to upload document. Please try again.', 'error');
      setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));
    }
  };

  const nextStep = async () => {
    if (token) {
      try {
        // Collect partial step data payload to commit
        let stepPayload: Record<string, any> = {};
        if (currentStep === 1) {
          stepPayload = {
            fullName: onboardingData.fullName,
            dob: onboardingData.dob,
            gender: onboardingData.gender,
            profilePhoto: onboardingData.profilePhoto,
            languages: onboardingData.languages,
          };
        } else if (currentStep === 2) {
          stepPayload = {
            permAddress: onboardingData.permAddress,
            currAddress: onboardingData.currAddress,
            city: onboardingData.city,
          };
        } else if (currentStep === 3) {
          stepPayload = {
            drivingLicense: onboardingData.drivingLicense,
            aadhaarId: onboardingData.aadhaarId,
            panCard: onboardingData.panCard,
            policeVerification: onboardingData.policeVerification,
            addressProof: onboardingData.addressProof,
          };
        } else if (currentStep === 4) {
          stepPayload = {
            manualExpertise: onboardingData.manualExpertise,
            automaticExpertise: onboardingData.automaticExpertise,
            yearsOfExperience: onboardingData.yearsOfExperience,
          };
        } else if (currentStep === 5) {
          stepPayload = {
            accountNo: onboardingData.accountNo,
            ifscCode: onboardingData.ifscCode,
            holderName: onboardingData.holderName,
            upiId: onboardingData.upiId,
            cancelledCheque: onboardingData.cancelledCheque,
          };
        } else if (currentStep === 6) {
          stepPayload = {
            emergencyName: onboardingData.emergencyName,
            emergencyRelation: onboardingData.emergencyRelation,
            emergencyPhone: onboardingData.emergencyPhone,
          };
        } else if (currentStep === 7) {
          stepPayload = {
            signatureName: onboardingData.signatureName,
            agreedToTerms: onboardingData.agreedToTerms,
          };
        }

        await saveOnboardingStep(token, currentStep, stepPayload);
        logEvent('STEP_SYNC_SUCCESS', { step: currentStep });

        // Step 4 captures transmission skill. Persist it to the matchable driver record
        // (can_drive_manual gates manual-car bookings) — the onboarding JSONB blob the
        // step save writes is not read by the matcher.
        if (currentStep === 4) {
          try {
            await updateDriverProfile(token, { can_drive_manual: onboardingData.manualExpertise });
          } catch (err) {
            logEvent('CAN_DRIVE_MANUAL_SYNC_FAILED', { error: String(err) });
          }
        }
      } catch (err) {
        logEvent('STEP_SYNC_FAILED', { step: currentStep, error: String(err) });
      }
    }

    const next = currentStep + 1;
    setStep(next);
    logEvent('STEP_TRANSITION', { from: currentStep, to: next });
  };

  const prevStep = () => {
    const prev = currentStep - 1;
    setStep(prev);
    logEvent('STEP_TRANSITION', { from: currentStep, to: prev });
  };

  const saveAndExit = async () => {
    if (token) {
      try {
        await saveOnboardingStep(token, currentStep, onboardingData);
        logEvent('SAVE_AND_EXIT_SYNC_SUCCESS', { step: currentStep });
      } catch (err) {
        logEvent('SAVE_AND_EXIT_SYNC_FAILED', { step: currentStep, error: String(err) });
      }
    }
    useToastStore.getState().show('Progress saved — you can resume this application later.', 'success');
    router.push('/login?role=driver');
  };

  const selectLanguage = (lang: string) => {
    const current = [...onboardingData.languages];
    const index = current.indexOf(lang);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(lang);
    }
    setOnboardingData({ languages: current });
    logEvent('LANGUAGE_PREFERENCE_UPDATED', { languages: current });
  };

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 2;
    if (isAtBottom) {
      setTermsScrolledToBottom(true);
    }
  };

  const submitOnboarding = async () => {
    if (!token) return;

    logEvent('ONBOARDING_SUBMIT_START', { driverName: onboardingData.fullName });

    try {
      await saveOnboardingStep(token, 7, {
        signatureName: onboardingData.signatureName,
        agreedToTerms: onboardingData.agreedToTerms,
      });
      logEvent('ONBOARDING_COMPLETED', {
        driverName: onboardingData.fullName,
        timestamp: new Date().toISOString()
      });
      useToastStore.getState().show('Application submitted — pending KYC approval.', 'success');

      // Clear wizard store
      clearStore();

      router.push('/driver');
    } catch (err) {
      logEvent('ONBOARDING_SUBMIT_ERROR', { error: String(err) });
      useToastStore.getState().show('Failed to submit application. Check your connection and try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-content-primary p-4 sm:p-8 font-sans flex flex-col justify-between">
      {/* Hidden file input for document uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
      />
      
      {/* Onboarding Header */}
      <header className="border-b border-border-opaque pb-4 flex justify-between items-center w-full max-w-4xl mx-auto text-left">
        <div>
          <h1 className="text-display-serif text-[28px] text-content-primary">Driver Partner Registration</h1>
          <p className="text-paragraph-small text-content-secondary mt-1">7-Step Safety & KYC Compliance Wizard</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveAndExit}
            className="text-label-medium text-content-secondary border border-border-opaque px-4 h-9 rounded-sm hover:bg-background-secondary hover:text-content-primary transition-base cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </header>

      {/* Progress Stepper Bar */}
      <div className="w-full max-w-4xl mx-auto my-6">
        <div className="flex justify-between items-center text-label-small mb-2 text-content-secondary">
          <span>Step <span className="font-mono tabular-nums">{currentStep}</span> of <span className="font-mono tabular-nums">7</span></span>
          <span className="font-mono tabular-nums">{Math.round((currentStep / 7) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-background-tertiary rounded-pill w-full overflow-hidden flex gap-0.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full transition-all duration-300 ${
                i + 1 <= currentStep ? 'bg-accent-400' : 'bg-background-tertiary'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Active Form Step Cards rendering */}
      <main className="w-full max-w-4xl mx-auto flex-grow flex items-center justify-center my-6">
        <div className="w-full card sm:p-8 space-y-6 text-left relative overflow-hidden">
          
          {/* STEP 1: PERSONAL DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-heading-medium text-content-primary border-b border-border-opaque pb-3">Step 1 — Personal Identification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Full Legal Name (matching PAN/Aadhaar)</label>
                  <input
                    type="text"
                    value={onboardingData.fullName}
                    onChange={(e) => setOnboardingData({ ...onboardingData, fullName: e.target.value })}
                    className="input text-paragraph-medium"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={onboardingData.dob}
                    onChange={(e) => setOnboardingData({ ...onboardingData, dob: e.target.value })}
                    className="input text-paragraph-medium"
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Gender Identification</label>
                  <select
                    value={onboardingData.gender}
                    onChange={(e) => setOnboardingData({ ...onboardingData, gender: e.target.value })}
                    className="input text-paragraph-medium"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['English', 'Hindi', 'Bengali', 'Kannada', 'Tamil'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => selectLanguage(lang)}
                        className={`text-label-small py-1.5 px-3.5 rounded-pill border transition-base cursor-pointer ${
                          onboardingData.languages.includes(lang)
                            ? 'bg-interactive-primary border-border-selected text-interactive-primary-text'
                            : 'bg-background-secondary border-border-opaque text-content-secondary hover:text-content-primary'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-label-small text-content-secondary mb-2">Profile Photo Scan</label>
                <div className="flex items-center gap-4 bg-background-secondary p-4 border border-border-opaque rounded-sm">
                  <div className="h-16 w-16 bg-background-tertiary rounded-sm flex items-center justify-center text-label-small text-content-secondary shrink-0">
                    {onboardingData.profilePhoto ? '✔️ Ready' : 'No photo'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadClick('profilePhoto', 'PROFILE_PHOTO')}
                      className="bg-interactive-primary hover:opacity-90 text-interactive-primary-text rounded-sm px-4 h-10 text-label-medium transition-base cursor-pointer tabular-nums"
                    >
                      {uploadProgress.profilePhoto ? `Uploading ${uploadProgress.profilePhoto}%` : 'Upload Live Scan'}
                    </button>
                    {uploadProgress.profilePhoto > 0 && uploadProgress.profilePhoto < 100 && (
                      <div className="h-1 w-full bg-background-tertiary rounded-pill overflow-hidden">
                        <div
                          className="h-full bg-accent-400 rounded-pill transition-all duration-150"
                          style={{ width: `${uploadProgress.profilePhoto}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-heading-medium text-content-primary border-b border-border-opaque pb-3">Step 2 — Operating Location</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Permanent Residential Address</label>
                  <textarea
                    rows={2}
                    value={onboardingData.permAddress}
                    onChange={(e) => setOnboardingData({ ...onboardingData, permAddress: e.target.value })}
                    className="w-full bg-background-secondary border border-border-opaque rounded-sm p-3 text-paragraph-medium text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-accent-400 transition-base"
                    placeholder="Enter permanent address details..."
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Current Residential Address</label>
                  <textarea
                    rows={2}
                    value={onboardingData.currAddress}
                    onChange={(e) => setOnboardingData({ ...onboardingData, currAddress: e.target.value })}
                    className="w-full bg-background-secondary border border-border-opaque rounded-sm p-3 text-paragraph-medium text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-accent-400 transition-base"
                    placeholder="Enter current address details..."
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Primary City of Operation</label>
                  <select
                    value={onboardingData.city}
                    onChange={(e) => setOnboardingData({ ...onboardingData, city: e.target.value })}
                    className="input text-paragraph-medium"
                  >
                    <option>Kolkata</option>
                    <option>Bangalore</option>
                    <option>Mumbai</option>
                    <option>Delhi NCR</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: KYC DOCUMENTS */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-heading-medium text-content-primary border-b border-border-opaque pb-3">Step 3 — KYC Verification Credentials</h2>
              <div className="space-y-4">
                {[
                  { field: 'drivingLicense', label: 'Driving License (Front & Back OCR Scan)', type: 'DL_FRONT' },
                  { field: 'aadhaarId', label: 'Aadhaar Card (National ID)', type: 'AADHAAR' },
                  { field: 'panCard', label: 'Permanent Account Number (PAN Card)', type: 'PAN' },
                  { field: 'policeVerification', label: 'Police Clearance Certificate (Last 6 Months)', type: 'POLICE_VERIFY' },
                  { field: 'addressProof', label: 'Address Proof Document (Utility Bill / Rent Agreement)', type: 'ADDRESS_PROOF' }
                ].map((doc) => (
                  <div key={doc.field} className="bg-background-secondary p-4 border border-border-opaque rounded-sm space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-grow">
                        <span className="block text-label-medium text-content-primary">{doc.label}</span>
                        <span className="block text-paragraph-small text-content-secondary mt-1">
                          {onboardingData[doc.field as keyof typeof onboardingData]
                            ? <span className="badge badge-accent font-mono">Synced · {onboardingData[doc.field as keyof typeof onboardingData]?.toString().slice(0, 30)}…</span>
                            : 'Awaiting secure document submission'
                          }
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerUploadClick(doc.field, doc.type)}
                        className="bg-interactive-primary hover:opacity-90 text-interactive-primary-text rounded-sm px-4 h-10 text-label-medium transition-base cursor-pointer shrink-0 tabular-nums"
                      >
                        {uploadProgress[doc.field] ? `Uploading ${uploadProgress[doc.field]}%` : 'Upload Doc'}
                      </button>
                    </div>
                    {uploadProgress[doc.field] > 0 && uploadProgress[doc.field] < 100 && (
                      <div className="h-1 w-full bg-background-tertiary rounded-pill overflow-hidden">
                        <div
                          className="h-full bg-accent-400 rounded-pill transition-all duration-150"
                          style={{ width: `${uploadProgress[doc.field]}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: VEHICLE EXPERTISE */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-heading-medium text-content-primary border-b border-border-opaque pb-3">Step 4 — Transmission & Expertise Filters</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-label-small text-content-secondary mb-2">Transmission Systems Qualified to Drive</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOnboardingData({ ...onboardingData, manualExpertise: !onboardingData.manualExpertise })}
                      className={`py-4 rounded-sm border text-label-medium transition-base cursor-pointer flex flex-col items-center gap-2 ${
                        onboardingData.manualExpertise ? 'bg-interactive-primary text-interactive-primary-text border-border-selected' : 'bg-background-secondary border-border-opaque text-content-secondary'
                      }`}
                    >
                      <AnimatedIcon src={AnimSettings} size={48} trigger="in" />
                      <span>Manual Gearbox</span>
                      <span className="text-label-small opacity-80">{onboardingData.manualExpertise ? 'Certified' : 'Bypassed'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingData({ ...onboardingData, automaticExpertise: !onboardingData.automaticExpertise })}
                      className={`py-4 rounded-sm border text-label-medium transition-base cursor-pointer flex flex-col items-center gap-2 ${
                        onboardingData.automaticExpertise ? 'bg-interactive-primary text-interactive-primary-text border-border-selected' : 'bg-background-secondary border-border-opaque text-content-secondary'
                      }`}
                    >
                      <AnimatedIcon src={AnimCar} size={48} trigger="in" />
                      <span>Automatic / EV</span>
                      <span className="text-label-small opacity-80">{onboardingData.automaticExpertise ? 'Certified' : 'Bypassed'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Professional Driving Experience (Years)</label>
                  <input
                    type="number"
                    value={onboardingData.yearsOfExperience}
                    onChange={(e) => setOnboardingData({ ...onboardingData, yearsOfExperience: e.target.value })}
                    className="input text-paragraph-medium font-mono"
                    placeholder="e.g. 5"
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: BANK DETAILS */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-heading-medium text-content-primary border-b border-border-opaque pb-3">Step 5 — Payout Bank Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={onboardingData.accountNo}
                    onChange={(e) => setOnboardingData({ ...onboardingData, accountNo: e.target.value })}
                    className="input text-paragraph-medium font-mono"
                    placeholder="Enter Bank Account No"
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">IFSC Code</label>
                  <input
                    type="text"
                    value={onboardingData.ifscCode}
                    onChange={(e) => setOnboardingData({ ...onboardingData, ifscCode: e.target.value })}
                    onBlur={(e) => handleIfscBlur(e.target.value)}
                    className="input text-paragraph-medium font-mono"
                    placeholder="IFSC0001234"
                  />
                  {ifscLookup.status === 'loading' && (
                    <p className="mt-1.5 text-label-small text-content-secondary">Verifying IFSC…</p>
                  )}
                  {ifscLookup.status === 'verified' && ifscLookup.label && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-label-small text-content-positive">
                      <AnimatedIcon src={AnimCheck} size={18} trigger="in" colors="primary:#10B981,secondary:#6EE7B7" />
                      <span>{ifscLookup.label}</span>
                    </p>
                  )}
                  {ifscLookup.status === 'error' && (
                    <p className="mt-1.5 text-label-small text-content-secondary">Could not verify IFSC</p>
                  )}
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Account Holder Name</label>
                  <input
                    type="text"
                    value={onboardingData.holderName}
                    onChange={(e) => setOnboardingData({ ...onboardingData, holderName: e.target.value })}
                    className="input text-paragraph-medium"
                    placeholder="Enter Bank Holder Name"
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">UPI ID (for instant payouts)</label>
                  <input
                    type="text"
                    value={onboardingData.upiId}
                    onChange={(e) => setOnboardingData({ ...onboardingData, upiId: e.target.value })}
                    className="input text-paragraph-medium font-mono"
                    placeholder="name@okbank"
                  />
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-label-small text-content-secondary mb-2">Upload Cancelled Cheque / Statement Proof</label>
                <div className="flex items-center gap-4 bg-background-secondary p-4 border border-border-opaque rounded-sm">
                  <div className="h-12 w-12 bg-background-tertiary rounded-sm flex items-center justify-center text-label-small text-content-secondary shrink-0 text-center">
                    {onboardingData.cancelledCheque ? '✔️' : 'No file'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadClick('cancelledCheque', 'CANCELLED_CHEQUE')}
                      className="bg-interactive-primary hover:opacity-90 text-interactive-primary-text rounded-sm px-4 h-10 text-label-medium transition-base cursor-pointer tabular-nums"
                    >
                      {uploadProgress.cancelledCheque ? `Uploading ${uploadProgress.cancelledCheque}%` : 'Upload Cancelled Cheque'}
                    </button>
                    {uploadProgress.cancelledCheque > 0 && uploadProgress.cancelledCheque < 100 && (
                      <div className="h-1 w-full bg-background-tertiary rounded-pill overflow-hidden">
                        <div
                          className="h-full bg-accent-400 rounded-pill transition-all duration-150"
                          style={{ width: `${uploadProgress.cancelledCheque}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: EMERGENCY CONTACT */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-heading-medium text-content-primary border-b border-border-opaque pb-3">Step 6 — Emergency Contacts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    value={onboardingData.emergencyName}
                    onChange={(e) => setOnboardingData({ ...onboardingData, emergencyName: e.target.value })}
                    className="input text-paragraph-medium"
                    placeholder="Emergency Contact Name"
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Relationship</label>
                  <input
                    type="text"
                    value={onboardingData.emergencyRelation}
                    onChange={(e) => setOnboardingData({ ...onboardingData, emergencyRelation: e.target.value })}
                    className="input text-paragraph-medium"
                    placeholder="e.g. Spouse / Sibling / Parent"
                  />
                </div>
                <div>
                  <label className="block text-label-small text-content-secondary mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={onboardingData.emergencyPhone}
                    onChange={(e) => setOnboardingData({ ...onboardingData, emergencyPhone: e.target.value })}
                    className="input text-paragraph-medium"
                    placeholder="+91 99999 00000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: AGREEMENT */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-heading-medium text-content-primary border-b border-border-opaque pb-3">Step 7 — Digitally Sign Agreements</h2>
              <div className="space-y-4 text-content-secondary text-paragraph-small">
                <div
                  onScroll={handleTermsScroll}
                  className="bg-background-secondary p-4 rounded-sm border border-border-opaque max-h-48 overflow-y-auto space-y-3 font-sans"
                >
                  <h4 className="text-label-medium text-content-primary">Terms & Conditions of Partner Dispatch Node</h4>
                  <p>1. The Driver Partner acts as an independent service provider executing matching allocations on behalf of registered vehicle owners.</p>
                  <p>2. Payment ledgers, fees, night surcharges, and wait-time commissions are settled directly via platform escrow accounts upon successful trip confirmations.</p>
                  <p>3. Telemetry tracking coordinates are ingested every 4-5 seconds and are mandatory to maintain connectivity inside Redis spatial clusters.</p>
                  <p>4. Safety regulations and maximum fatigue controls (mandatory rest after 10 hours) must be followed without exception.</p>
                </div>

                <div className="flex justify-between items-center text-label-small">
                  {termsScrolledToBottom ? (
                    <span className="text-content-positive">✓ Terms Read & Completed</span>
                  ) : (
                    <span className="text-content-secondary">↓ Please scroll to the bottom of terms to read</span>
                  )}
                </div>
                
                <div className="space-y-3 font-sans">
                  <label className="flex items-start gap-2 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={onboardingData.agreedToTerms}
                      onChange={(e) => setOnboardingData({ ...onboardingData, agreedToTerms: e.target.checked })}
                      className="mt-0.5"
                    />
                    <span>I read, understood, and digitally authorize the terms, safety guidelines, and escrow payment settlement criteria.</span>
                  </label>

                  <div>
                    <label className="block text-label-small text-content-secondary mb-1.5">Digital Signature (Type your Full Legal Name)</label>
                    <input
                      type="text"
                      value={onboardingData.signatureName}
                      onChange={(e) => setOnboardingData({ ...onboardingData, signatureName: e.target.value })}
                      className="input text-paragraph-medium italic"
                      placeholder="Type name to sign digitally"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex justify-between items-center border-t border-border-opaque pt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              type="button"
              className="h-11 px-6 rounded-sm border border-border-opaque text-content-secondary text-label-medium hover:text-content-primary hover:bg-background-secondary transition-base cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              Back
            </button>

            {currentStep < 7 ? (
              <button
                onClick={nextStep}
                type="button"
                className="h-11 px-8 rounded-sm bg-interactive-primary hover:opacity-90 text-interactive-primary-text text-label-medium font-semibold transition-base cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                Next
              </button>
            ) : (
              <button
                onClick={submitOnboarding}
                disabled={!termsScrolledToBottom || !onboardingData.agreedToTerms || !onboardingData.signatureName.trim()}
                type="button"
                className="h-11 px-8 rounded-sm bg-interactive-primary hover:opacity-90 text-interactive-primary-text text-label-medium font-semibold transition-base cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                I Agree and Submit Application
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Onboarding Logs Terminal panel */}
      {logs.length > 0 && (
        <div className="w-full max-w-4xl mx-auto border-t border-border-opaque pt-4 text-left">
          <span className="text-label-small text-content-secondary block mb-2">Live verification audit log</span>
          <div className="bg-background-secondary border border-border-opaque rounded-sm p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-content-secondary space-y-1 scrollbar-thin">
            {logs.map((lg, i) => (
              <div key={i} className="truncate select-all">{lg}</div>
            ))}
          </div>
        </div>
      )}

      <footer className="w-full max-w-4xl mx-auto text-left flex justify-between items-center text-label-small text-content-tertiary pt-4 mt-6 border-t border-border-opaque">
        <span>Identity verification active</span>
        <span>Hubs: Kolkata · Bangalore</span>
      </footer>
    </div>
  );
}
