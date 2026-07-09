'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  getDriverProfile,
  DriverProfile,
  getDriverDocuments,
  DriverKycDocument,
  updateDriverProfile,
  uploadDocument,
  getVehicles,
  DriverVehicleFull,
  getDriverCityConfig,
  DriverCityConfig,
} from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { UserIcon, EditIcon, StarIcon, SettingsIcon, VehicleIcon } from '@/components/ds/Icon';

export default function DriverProfilePage() {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const driverName = profile?.name || user?.name || 'Driver Partner';
  const driverPhone = profile?.phone || user?.phone || 'Phone unavailable';
  const cityPrefix = profile?.city_prefix || 'KOL';
  const [cityConfig, setCityConfig] = useState<DriverCityConfig | null>(null);

  // Empty until the API seeds a real bio — no fabricated marketing default.
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);

  // Live-only: never show fabricated "Verified" statuses while the API loads.
  const [kycDocs, setKycDocs] = useState<DriverKycDocument[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<DriverVehicleFull[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocTypeRef = useRef<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getDriverProfile(token)
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          if (typeof data.bio === 'string') setBio(data.bio);
          setProfileError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[DriverProfile] Profile fetch failed:', err);
          setProfileError('Live profile data is unavailable.');
        }
      });

    getDriverDocuments(token)
      .then((data) => {
        if (!cancelled && data?.documents?.length) {
          setKycDocs(data.documents);
          setDocsError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[DriverProfile] Documents fetch failed:', err);
          setDocsError('Live document statuses are unavailable.');
        }
      });

    getVehicles(token)
      .then((data) => {
        if (!cancelled) setVehicles(data?.vehicles ?? []);
      })
      .catch(() => { /* section renders a fallback line */ });

    getDriverCityConfig(token)
      .then((cfg) => {
        if (!cancelled) setCityConfig(cfg);
      })
      .catch(() => { /* falls back to the prefix */ });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSaveBio = async () => {
    if (!token) {
      setIsEditingBio(false);
      return;
    }
    setSavingBio(true);
    setBioMessage(null);
    try {
      await updateDriverProfile(token, { bio });
      setIsEditingBio(false);
      setBioMessage('Bio statement saved.');
    } catch (err) {
      console.warn('[DriverProfile] Bio save failed:', err);
      setBioMessage('Failed to save bio. Please try again.');
    } finally {
      setSavingBio(false);
    }
  };

  // Pick a doc type then open the native file picker; upload runs on file selection.
  const handleUploadDoc = () => {
    const docType = prompt('Enter the name of the new document to upload:');
    if (!docType) return;
    pendingDocTypeRef.current = docType;
    fileInputRef.current?.click();
  };

  const handleDocFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    const docType = pendingDocTypeRef.current;
    if (!file || !docType) return;

    if (!token) {
      setUploadMessage('Session expired. Please sign in again to upload.');
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    try {
      const res = await uploadDocument(token, docType, file);
      setKycDocs((prev) => [
        ...prev,
        { name: docType, status: res.status || 'Pending Verification', date: new Date().toISOString().split('T')[0] },
      ]);
      setUploadMessage(`Document "${docType}" uploaded and sent for admin review.`);
    } catch (err) {
      console.warn('[DriverProfile] Document upload failed:', err);
      setUploadMessage(`Failed to upload "${docType}". Please try again.`);
    } finally {
      setUploading(false);
      pendingDocTypeRef.current = '';
    }
  };

  // Profile photo edit: upload as a PROFILE_PHOTO document, then persist the name via PATCH.
  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!token) {
      setUploadMessage('Session expired. Please sign in again to update your photo.');
      return;
    }
    setPhotoUploading(true);
    setUploadMessage(null);
    try {
      await uploadDocument(token, 'PROFILE_PHOTO', file);
      await updateDriverProfile(token, { name: driverName });
      setUploadMessage('Profile photo updated.');
    } catch (err) {
      console.warn('[DriverProfile] Photo update failed:', err);
      setUploadMessage('Failed to update profile photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Hidden inputs for document + photo upload */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleDocFileSelected} />
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFileSelected} />

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-content-primary font-move">My Partner Profile</h2>
        <p className="text-content-tertiary text-[10px] font-mono uppercase tracking-wider mt-0.5">Manage credentials, bio, and KYC document uploads</p>
        {profileError && <p className="text-content-negative text-[10px] font-mono mt-2">{profileError}</p>}
      </div>

      {/* Profile Overview Card */}
      <div className="bg-background-primary border border-border-opaque rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={photoUploading}
          aria-label="Edit profile photo"
          className="h-20 w-20 bg-background-secondary border border-border-opaque rounded-2xl flex items-center justify-center text-3xl shrink-0 cursor-pointer hover:border-forest-400 transition disabled:opacity-50 relative"
        >
          {photoUploading ? <span className="text-xs font-mono animate-pulse">…</span> : <UserIcon size={32} />}
          <span className="absolute -bottom-1 -right-1 bg-interactive-primary text-interactive-primary-text text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full"><EditIcon size={12} /></span>
        </button>

        <div className="space-y-2 text-center sm:text-left flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-base font-bold text-content-primary">{driverName}</h3>
            <span className="bg-positive-400/20 text-content-positive border border-positive-400 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider w-max mx-auto sm:mx-0">
              {profile?.is_verified === false ? 'KYC Pending' : 'KYC Active'}
            </span>
          </div>
          <p className="text-xs text-content-tertiary font-mono">{driverPhone} • Hub: {cityPrefix}</p>

          <div className="flex justify-center sm:justify-start gap-4 text-xs font-mono pt-1 text-content-secondary">
            <div>
              <span className="text-content-tertiary block text-[9px] uppercase">RATING</span>
              <span className="font-bold text-content-warning"><StarIcon size={14} className="text-content-warning fill-current" /> 4.92</span>
            </div>
            <div className="border-r border-border-opaque h-6"></div>
            <div>
              <span className="text-content-tertiary block text-[9px] uppercase">TOTAL TRIPS</span>
              <span className="font-bold text-content-primary">{profile?.total_trips ?? 0} Jobs</span>
            </div>
            <div className="border-r border-border-opaque h-6"></div>
            <div>
              <span className="text-content-tertiary block text-[9px] uppercase">ACCEPTANCE</span>
              <span className="font-bold text-content-positive">
                {profile ? `${Math.round(profile.acceptance_rate * 100)}%` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Editor */}
      <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-border-opaque pb-2">
          <h4 className="text-xs font-bold text-content-primary font-mono uppercase tracking-wider">Pilot Bio Statement</h4>
          <button
            onClick={() => (isEditingBio ? handleSaveBio() : setIsEditingBio(true))}
            disabled={savingBio}
            className="text-[9px] font-mono font-bold text-content-secondary hover:text-content-primary uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {savingBio ? 'Saving…' : isEditingBio ? 'Save Statement' : 'Edit Bio'}
          </button>
        </div>

        {isEditingBio ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-background-secondary border border-border-opaque rounded-xl p-3 text-xs text-content-primary focus:outline-none focus:border-border-opaque font-sans"
            rows={3}
          />
        ) : (
          <p className="text-xs text-content-secondary leading-relaxed font-sans">
            {bio || 'Add a short bio so riders know a bit about you.'}
          </p>
        )}
        {bioMessage && (
          <p className={`text-[10px] font-mono ${bioMessage.startsWith('Failed') ? 'text-content-negative' : 'text-content-positive'}`}>
            {bioMessage}
          </p>
        )}
      </div>

      {/* Technical Badges and Languages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-content-primary font-mono uppercase tracking-wider border-b border-border-opaque pb-2">
            Transmission Licenses
          </h4>
          <div className="flex gap-2">
            <span className="bg-background-secondary text-content-primary border border-border-opaque px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider">
              <SettingsIcon size={14} /> Stick Shift Manual
            </span>
            <span className="bg-background-secondary text-content-primary border border-border-opaque px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider">
              <VehicleIcon size={14} /> Automatic / EV
            </span>
          </div>
        </div>

        <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-content-primary font-mono uppercase tracking-wider border-b border-border-opaque pb-2">
            Verified Languages
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {['Bengali (Native)', 'English (Professional)', 'Hindi (Fluent)'].map((lang) => (
              <span key={lang} className="bg-background-secondary text-content-secondary border border-border-opaque px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* KYC Documents Section */}
      <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-border-opaque pb-2">
          <h4 className="text-xs font-bold text-content-primary font-mono uppercase tracking-wider">KYC Compliance Documents</h4>
          <button
            onClick={handleUploadDoc}
            disabled={uploading}
            className="bg-interactive-primary hover:bg-interactive-hover text-interactive-primary-text text-[9px] font-mono font-bold uppercase px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload New Doc'}
          </button>
        </div>

        {docsError && <p className="text-content-negative text-[10px] font-mono">{docsError}</p>}
        {uploadMessage && (
          <p className={`text-[10px] font-mono ${uploadMessage.startsWith('Failed') || uploadMessage.startsWith('Session') ? 'text-content-negative' : 'text-content-positive'}`}>
            {uploadMessage}
          </p>
        )}

        <div className="divide-y divide-border-opaque">
          {kycDocs.map((doc, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center text-xs font-mono">
              <div>
                <span className="text-content-primary block font-medium font-sans">{doc.name}</span>
                <span className="text-content-tertiary text-[8px] block mt-0.5">Uploaded on: {doc.date}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                doc.status === 'Verified'
                  ? 'bg-surface-positive/20 text-content-positive border-positive-400'
                  : 'bg-surface-warning/20 text-content-warning border-warning-400'
              }`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Serviced Cities and Vehicles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-2.5">
          <span className="text-content-tertiary block text-[9px] uppercase font-mono tracking-wider font-bold">Serviced City</span>
          <p className="text-xs text-content-primary leading-relaxed">
            {cityConfig?.city_name ? `${cityConfig.city_name} (${cityConfig.city_prefix})` : `Regional hub: ${cityPrefix}`}
            {cityConfig?.operating_hours_start && cityConfig?.operating_hours_end
              ? ` · ${cityConfig.operating_hours_start}–${cityConfig.operating_hours_end}`
              : ''}
          </p>
        </div>
        <div className="bg-background-primary border border-border-opaque rounded-2xl p-5 space-y-2.5">
          <span className="text-content-tertiary block text-[9px] uppercase font-mono tracking-wider font-bold">Registered Vehicles</span>
          <p className="text-xs text-content-primary leading-relaxed">
            {vehicles.length
              ? vehicles.map((v) => `${v.plate} (${v.make} ${v.model}, ${v.transmission})`).join(', ')
              : 'No vehicles on file — add one under Vehicles.'}
          </p>
        </div>
      </div>

    </div>
  );
}
