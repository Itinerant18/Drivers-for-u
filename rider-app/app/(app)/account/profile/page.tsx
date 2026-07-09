"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/lib/api/client";
import { AccountScaffold } from "@/components/account/AccountScaffold";
import { compressImage, blobToDataUrl } from "@/lib/utils/imageCompress";
import { BlurFade } from "@/components/ui/blur-fade";
import { PixelImage } from "@/components/ui/pixel-image";

const INPUT =
  "w-full rounded-xl bg-background-tertiary px-4 py-3 text-sm text-content-primary outline-none placeholder:text-content-tertiary focus:ring-1 focus:ring-border-accent";

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

type Field = "name" | "email" | "dob";
type Errors = Partial<Record<Field, string>>;

function validate(field: Field, value: string): string | undefined {
  if (field === "name" && value.trim().length < 2) return "Enter your full name";
  if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Invalid email address";
  if (field === "dob" && value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime()) || d > new Date()) return "Invalid date";
  }
  return undefined;
}

interface PhotoUploadResponse {
  data?: { url?: string };
}

/**
 * Upload the (compressed) photo to S3 via the multipart endpoint.
 * Returns the hosted URL on success, or null when uploads are unconfigured
 * (503) or the request fails — letting the caller fall back to a data-URL.
 */
async function uploadPhotoToS3(blob: Blob): Promise<string | null> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(TOKEN_STORAGE_KEY)
      : null;
  if (!token) return null;

  const form = new FormData();
  form.append("file", blob, "profile.jpg");

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/rider/me/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as PhotoUploadResponse;
    return body.data?.url ?? null;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const rider = useAuthStore((s) => s.rider);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(rider?.name ?? "");
  const [email, setEmail] = useState(rider?.email ?? "");
  const [dob, setDob] = useState(rider?.date_of_birth ?? "");
  const [gender, setGender] = useState(rider?.gender ?? "");
  const [photo, setPhoto] = useState<string | null>(rider?.profile_photo_url ?? null);

  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const onBlur = (field: Field, value: string) =>
    setErrors((e) => ({ ...e, [field]: validate(field, value) }));

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadPct(10);
    try {
      const blob = await compressImage(file, 800, 0.8);
      setUploadPct(40);

      // Try uploading to S3 first; fall back to an inline data-URL if the
      // upload endpoint is unconfigured (503) or otherwise fails.
      const url = await uploadPhotoToS3(blob);
      if (url) {
        setUploadPct(90);
        setPhoto(url);
        try {
          await authApi.updateProfile({ profile_photo_url: url });
        } catch {
          /* keep the local preview even if the profile save fails */
        }
        setUploadPct(100);
        setTimeout(() => setUploadPct(null), 400);
        return;
      }

      // Fallback: inline data-URL (saved with the rest of the form on Save).
      const dataUrl = await blobToDataUrl(blob);
      setUploadPct(100);
      setPhoto(dataUrl);
      setTimeout(() => setUploadPct(null), 400);
    } catch {
      setUploadPct(null);
    }
  };

  const canSave = !errors.name && !errors.email && !errors.dob && name.trim().length >= 2;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await authApi.updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        gender: gender || undefined,
        preferred_language: "en",
        date_of_birth: dob || undefined,
        profile_photo_url: photo ?? undefined,
      });
      await fetchMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setErrors((e) => ({ ...e, name: "Could not save. Try again." }));
    } finally {
      setSaving(false);
    }
  };

  const kycVerified = rider?.kyc_level && rider.kyc_level !== "NONE";
  const initials = (name || "?").trim().slice(0, 1).toUpperCase();

  return (
    <AccountScaffold title="Profile">
      {/* Avatar */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col items-center">
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile photo"
            className="relative h-24 w-24 overflow-hidden rounded-full bg-surface-accent active:scale-95 press-spring"
          >
            {photo ? (
              <PixelImage
                src={photo}
                grid="4x6"
                pixelFadeInDuration={800}
                maxAnimationDelay={600}
                colorRevealDelay={900}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-content-accent">
                {initials}
              </span>
            )}
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-sm ring-2 ring-background-primary">
              ✎
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePhoto}
          />
          {uploadPct !== null && (
            <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-background-tertiary">
              <div className="h-full bg-secondary transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
          )}
        </div>
      </BlurFade>

      {/* KYC banner */}
      <BlurFade delay={0.2}>
        <div
          className={`mt-5 flex items-center justify-between rounded-2xl p-4 ${
            kycVerified ? "bg-surface-positive" : "bg-surface-accent"
          }`}
        >
          <div>
            <p className={`text-sm font-semibold ${kycVerified ? "text-content-positive" : "text-content-accent"}`}>
              {kycVerified ? "KYC Verified" : "Identity not verified"}
            </p>
            <p className="text-xs text-content-secondary">Level: {rider?.kyc_level ?? "NONE"}</p>
          </div>
        </div>
      </BlurFade>

      {/* Fields */}
      <BlurFade delay={0.3}>
        <div className="mt-5 space-y-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => onBlur("name", e.target.value)}
              className={INPUT}
              placeholder="Full name"
            />
            {errors.name && <FieldError msg={errors.name} />}
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => onBlur("email", e.target.value)}
              className={INPUT}
              placeholder="you@example.com"
            />
            {errors.email && <FieldError msg={errors.email} />}
            {rider?.email_verified && <p className="mt-1 text-xs text-content-positive">✓ Verified</p>}
          </Field>

          <Field label="Date of Birth">
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              onBlur={(e) => onBlur("dob", e.target.value)}
              className={INPUT}
            />
            {errors.dob && <FieldError msg={errors.dob} />}
          </Field>

          <Field label="Gender">
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`rounded-xl px-3.5 py-2 text-sm active:scale-95 press-spring ${
                    gender === g ? "bg-secondary text-content-primary" : "bg-background-tertiary text-content-secondary"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Phone">
            <div className="flex items-center justify-between rounded-xl bg-background-tertiary px-4 py-3">
              <span className="text-sm text-content-primary">{rider?.phone}</span>
              <Link
                href="/account/support"
                className="text-xs font-semibold text-content-accent active:scale-95 press-spring"
              >
                Change
              </Link>
            </div>
          </Field>
        </div>
      </BlurFade>

      {/* Save */}
      <BlurFade delay={0.4}>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="mt-6 w-full rounded-2xl bg-interactive-primary py-4 text-base font-bold text-interactive-primary-text disabled:opacity-40 active:scale-[0.98] press-spring"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </BlurFade>
    </AccountScaffold>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-content-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs text-content-negative">{msg}</p>;
}
