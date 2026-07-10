'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  getDriverProfile,
  getDriverDocuments,
  DriverKycDocument,
  updateDriverProfile,
  uploadDocument,
} from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

// Documents & bio — the KYC upload + bio-editor flows that used to live on the
// legacy profile page. The redesigned ProfileScreen links here from its menu.

export default function DriverDocumentsPage() {
  const { token } = useAuthStore();

  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);

  const [kycDocs, setKycDocs] = useState<DriverKycDocument[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocTypeRef = useRef<string>('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    getDriverProfile(token)
      .then((data) => {
        if (!cancelled && typeof data.bio === 'string') setBio(data.bio);
      })
      .catch(() => { /* bio editor still works; save will surface errors */ });

    getDriverDocuments(token)
      .then((data) => {
        if (!cancelled && data?.documents?.length) {
          setKycDocs(data.documents);
          setDocsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setDocsError('Live document statuses are unavailable.');
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleSaveBio = async () => {
    if (!token) { setIsEditingBio(false); return; }
    setSavingBio(true);
    setBioMessage(null);
    try {
      await updateDriverProfile(token, { bio });
      setIsEditingBio(false);
      setBioMessage('Bio statement saved.');
    } catch {
      setBioMessage('Failed to save bio. Please try again.');
    } finally {
      setSavingBio(false);
    }
  };

  const handleUploadDoc = () => {
    const docType = prompt('Enter the name of the new document to upload:');
    if (!docType) return;
    pendingDocTypeRef.current = docType;
    fileInputRef.current?.click();
  };

  const handleDocFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
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
    } catch {
      setUploadMessage(`Failed to upload "${docType}". Please try again.`);
    } finally {
      setUploading(false);
      pendingDocTypeRef.current = '';
    }
  };

  return (
    <div className="space-y-4 text-left px-500 py-400">
      <h1 className="text-xl font-sans font-bold text-content-primary">Documents & Bio</h1>

      {/* Bio Editor */}
      <div className="bg-background-primary border border-border-opaque rounded-sm p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-border-opaque pb-2">
          <h4 className="text-xs font-bold text-content-primary font-mono uppercase tracking-wider">Bio Statement</h4>
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
            className="w-full bg-background-secondary border border-border-opaque rounded-sm p-3 text-xs text-content-primary focus:outline-none focus:border-border-accent font-sans"
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

      {/* KYC Documents */}
      <div className="bg-background-primary border border-border-opaque rounded-sm p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-border-opaque pb-2">
          <h4 className="text-xs font-bold text-content-primary font-mono uppercase tracking-wider">KYC Compliance Documents</h4>
          <button
            onClick={handleUploadDoc}
            disabled={uploading}
            className="bg-interactive-primary hover:bg-interactive-hover text-interactive-primary-text text-[9px] font-mono font-bold uppercase px-3 py-1.5 rounded-pill cursor-pointer disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload New Doc'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleDocFileSelected}
          className="hidden"
          aria-label="KYC document file"
        />

        {docsError && <p className="text-content-negative text-[10px] font-mono">{docsError}</p>}
        {uploadMessage && (
          <p className={`text-[10px] font-mono ${uploadMessage.startsWith('Failed') || uploadMessage.startsWith('Session') ? 'text-content-negative' : 'text-content-positive'}`}>
            {uploadMessage}
          </p>
        )}

        {kycDocs.length === 0 && !docsError && (
          <p className="text-xs text-content-tertiary">No documents on file yet.</p>
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
    </div>
  );
}
