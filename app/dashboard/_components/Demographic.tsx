'use client'
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2, ChevronRight, RotateCcw, User, MapPin, Search } from 'lucide-react';
import Navbar from './Navbar';
import { useUserProfile } from '@/app/_context/UserProfileContext';
import { Country, State, City } from 'country-state-city';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils"
import { apiService } from '@/app/_utils/apiService';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { WebcamPhotoModal } from './WebcamPhotoModal';
import { NoRefreshScrollArea } from '@/app/_utils/NoRefreshScrollArea';
import { usePageGuard } from '@/app/_utils/usePageGuard';
import { useRouter } from 'next/navigation';

const DemographicPage: React.FC = () => {
  const allowed = usePageGuard('demographic');
  const { profile } = useUserProfile()

  const [form, setForm] = useState<any>({
    country: '',
    province: '',
    city: '',
    phoneNumber: '',
    gender: '',
  });
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openLang, setOpenLang] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openProvince, setOpenProvince] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [showPhoneConflictDialog, setShowPhoneConflictDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentExpanded, setConsentExpanded] = useState(false);
  const [phoneConflictRecord, setPhoneConflictRecord] = useState<{ id: string; fields: any } | null>(null);
  const [mrNumber, setMrNumber] = useState<string | null>(null);
  const [showPhotoChoice, setShowPhotoChoice] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPhotoChoice = () => setShowPhotoChoice(true);

  const handleGalleryPick = () => {
    setShowPhotoChoice(false);
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    setShowPhotoChoice(false);
    setShowWebcamModal(true);
  };

  useEffect(() => {
    if (!profile) return
    setForm((prev: any) => ({
      ...prev,
      country: profile.country || prev.country || '',
      city: profile.city || prev.city || '',
      stAddress: profile.location || prev.stAddress || '',
      province: profile.province || prev.province || '',
    }))
  }, [profile])

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => State.getStatesOfCountry(form.country), [form.country]);
  const cities = useMemo(() => City.getCitiesOfState(form.country, form.province), [form.country, form.province]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const updateForm = (key: string, value: any) => {
    setForm((prev: any) => {
      const updated = { ...prev, [key]: value };
      if (key === 'country') { updated.province = ''; updated.city = ''; }
      if (key === 'province') { updated.city = ''; }
      if (key === 'dob') {
        const parts = value.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          const birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (!isNaN(birthDate.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            updated.age = age > 0 ? age.toString() : '';
          }
        }
      } else if (key === 'age') {
        const ageNum = parseInt(value);
        if (!isNaN(ageNum)) {
          const today = new Date();
          const birthYear = today.getFullYear() - ageNum;
          updated.dob = `${birthYear}-01-01`;
        }
      }
      return updated;
    });
  };

  const handleSearch = async () => {
    if (!form.mrNumber && !form.phoneNumber) {
      return alert('Please enter a Phone Number or MR Number to search.');
    }

    setIsFinding(true);
    try {
      const patient = form.mrNumber
        ? await apiService.findPatientByMrNumber(form.mrNumber)
        : await apiService.findPatientByPhone(form.phoneNumber);

      if (patient) {
        const clean = (val: any) => (val === null || val === undefined || val === 'null' ? '' : val);

        setForm((prev: any) => ({
          ...prev,
          firstName: clean(patient.firstName),
          lastName: clean(patient.lastName),
          dob: clean(patient.dob),
          age: clean(patient.age),
          gender: clean(patient.gender),
          phoneNumber: clean(patient.phoneNumber) || prev.phoneNumber,
          mrNumber: clean(patient.mrNumber) || prev.mrNumber,
          stAddress: clean(patient.stAddress),
          country: clean(patient.country),
          province: clean(patient.province),
          city: clean(patient.city),
        }));
        setPatientId(patient.id);
        const cleanPhoto = clean(patient.profilePhoto);
        if (cleanPhoto) setPhotoUrl(cleanPhoto);
      } else {
        showNotification("No record found. Please fill in the details.");
      }
    } catch (error: any) {
      alert(error.message || "Search failed.");
    } finally {
      setIsFinding(false);
    }
  };

  const proceedWithSave = async (overrideId?: string | null) => {
    const idToUse = overrideId !== undefined ? overrideId : patientId;

    setIsSaving(true);
    try {
      const payload = {
        phoneNumber: `${form.phoneNumber}`,
        firstName: form.firstName,
        lastName: form.lastName,
        age: parseInt(form.age, 10),
        gender: form.gender,
        dob: form.dob,
        country: form.country,
        province: form.province,
        city: form.city,
        stAddress: form.stAddress,
        profilePhoto: form.profilePhoto,
        consentAccepted: true,
      };

      const patient = await apiService.saveOrUpdatePatient(payload, idToUse);
      setPatientId(patient.id);
      setToken(patient.token);
      setMrNumber(patient.mrNumber);
      localStorage.setItem('localClinic_entryId', patient.id);
      localStorage.removeItem('localClinic_session');
      localStorage.removeItem('localClinic_activeTab');

      const clinic = JSON.parse(localStorage.getItem('user') || '{}');

      if (clinic.isBifurcated === false) {
        // combined flow — hand off straight to vitals, one-time via sessionStorage
        sessionStorage.setItem('vitalsHandoff', JSON.stringify({
          patientId: patient.id,
          token: patient.token,
        }));
        router.push('/dashboard/vitals');
        return;
      }

      // bifurcated flow — show token, staff moves to vitals manually
      setShowTokenDialog(true);
    } catch (error: any) {
      showNotification(error.message || "Failed to save details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = () => {
    const required = ['phoneNumber', 'firstName', 'gender', 'dob', 'age', 'country', 'city', 'province'];
    const missing = required.filter(field => !form[field]);
    console.log('form state:', form); // TEMP
    console.log('missing fields:', missing); // TEMP
    if (missing.length > 0) return showNotification("Please Fill the required fields marked with *.");
    setShowConsentDialog(true);
  };

  const handleConsentReject = () => {
    setShowConsentDialog(false);
    showNotification("You must accept the Consent Form to proceed.");
  };

  useEffect(() => {
    if (showConsentDialog) setConsentExpanded(false);
  }, [showConsentDialog]);

  const handleConsentAccept = async () => {
    console.log('ACCEPT CLICKED');
    setShowConsentDialog(false);
    setIsSaving(true);

    try {
      if (!patientId) {
        try {
          const fullPhone = `${form.phoneNumber}`;
          const existing = await apiService.findPatientByPhone(fullPhone);
          if (existing) {
            const norm = (v: any) => (v ?? '').toString().trim().toLowerCase();
            const sameRecord =
              norm(existing.firstName) === norm(form.firstName) &&
              norm(existing.lastName) === norm(form.lastName) &&
              norm(existing.dob) === norm(form.dob) &&
              norm(existing.gender) === norm(form.gender);

            if (!sameRecord) {
              setPhoneConflictRecord({ id: existing.id, fields: existing });
              setShowPhoneConflictDialog(true);
              setIsSaving(false);
              return;
            }
          }
        } catch (err) {
          console.error("Phone conflict check failed:", err);
        }
      }

      await proceedWithSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmUpdateExisting = async () => {
    const idToUse = phoneConflictRecord?.id ?? null;
    setShowPhoneConflictDialog(false);
    setPatientId(idToUse);
    await proceedWithSave(idToUse);
    setPhoneConflictRecord(null);
  };

  const handleChangeNumber = () => {
    setShowPhoneConflictDialog(false);
    setPhoneConflictRecord(null);
    updateForm('phoneNumber', '');
  };

  const resetForm = () => {
    setForm({
      country: (profile as any)?.country || '',
      province: (profile as any)?.province || '',
      city: (profile as any)?.city || '',
      stAddress: (profile as any)?.location || '',
      phoneNumber: '',
      gender: '',
    });
    setPatientId(null);
    setPhotoUrl(null);
    setMrNumber(null);
  };

  const uploadPhotoFile = useCallback(async (file: File) => {
    setPhotoUploading(true);
    try {
      const data = await apiService.uploadPatientPhoto(file);
      if (data.url) {
        setPhotoUrl(data.url);
        updateForm('profilePhoto', data.url);
        showNotification('✅ Photo captured and uploaded successfully.');
      }
    } catch (err: any) {
      showNotification(err.message || '❌ Photo upload failed. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  }, []);

  const handleWebcamCapture = useCallback(async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `patient-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    await uploadPhotoFile(file);
  }, [uploadPhotoFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhotoFile(file);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('input, select'));
      const index = inputs.indexOf(e.target as any);
      if (index > -1 && inputs[index + 1]) {
        (inputs[index + 1] as HTMLElement).focus();
      }
    }
  };


  if (!allowed) return null;

  return (

    <div className="min-h-dvh bg-skeuo-base flex flex-col items-center w-full">
      <WebcamPhotoModal isOpen={showWebcamModal} onClose={() => setShowWebcamModal(false)} onCapture={handleWebcamCapture} />

      {/* ---------- Notification toast ---------- */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-skeuo-red text-white px-6 py-3 rounded-full shadow-lg text-sm font-semibold animate-fade-in flex items-center gap-2">
          <span>ℹ️</span> {notification}
        </div>
      )}

      <div className="w-full pb-12">
        <Navbar variant="demographic" />
      </div>
      <NoRefreshScrollArea>
        <main className="px-4 flex flex-col items-center">

          <div className="w-full -mt-10 mb-6">
            <div className="rounded-3xl border border-skeuo-surface bg-white shadow-xl shadow-black/5 overflow-hidden">

              {/* ================= HEADER ================= */}
              <div className="flex flex-col gap-3 border-b border-skeuo-surface px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-skeuo-red/10 text-skeuo-red">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-skeuo-text sm:text-xl">Patient Details</h2>
                    <p className="mt-0.5 text-xs text-skeuo-muted">Register a new patient or search an existing record</p>
                  </div>
                </div>

                {/* Photo picker */}
                <div className="flex flex-col items-center gap-1 self-center sm:self-auto">
                  <div className="relative group">
                    <div
                      className="h-14 w-14 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-skeuo-red bg-skeuo-red/10 flex items-center justify-center transition-all hover:border-solid hover:bg-skeuo-red/15"
                      onClick={openPhotoChoice}
                    >
                      {photoUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-skeuo-red" />
                      ) : photoUrl ? (
                        <img src={photoUrl} alt="Patient" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-skeuo-red opacity-50" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openPhotoChoice(); }}
                      className="absolute -bottom-0.5 -right-0.5 rounded-full bg-skeuo-red p-0.5 transition-colors hover:bg-skeuo-red-dark"
                      title="Take photo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-[9px] font-medium text-skeuo-muted">Photo</span>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {showPhotoChoice && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                      onClick={() => setShowPhotoChoice(false)}
                    >
                      <div className="w-64 rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-3 text-center text-sm font-semibold text-skeuo-text">Add Photo</h3>
                        <button
                          className="mb-2 w-full rounded-lg bg-skeuo-red py-2 text-sm font-medium text-white hover:bg-skeuo-red-dark"
                          onClick={handleTakePhoto}
                        >
                          Take Photo
                        </button>
                        <button
                          className="w-full rounded-lg bg-skeuo-surface py-2 text-sm font-medium text-skeuo-text hover:bg-skeuo-surface/80"
                          onClick={handleGalleryPick}
                        >
                          Upload from Gallery
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= FORM ================= */}
              <form className="space-y-3 px-5 py-3 sm:px-6" onSubmit={(e) => e.preventDefault()}>

                {/* ---------- Search section ---------- */}
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-skeuo-muted" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted">Find Existing Patient</h3>
                  </div>

                  <div className="rounded-lg border border-skeuo-red/15 bg-skeuo-red/5 px-4 py-2 text-sm text-skeuo-muted">
                    Enter a phone number and click <span className="font-semibold text-skeuo-text">Find</span> to retrieve existing patient data — or fill in the form below.
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        Phone Number <span className="text-skeuo-red">*</span>
                      </Label>
                      <Input
                        className="h-9 rounded-md border border-skeuo-surface bg-white py-0 focus-visible:ring-2 focus-visible:ring-skeuo-red/20 focus-visible:border-skeuo-red"
                        placeholder="03331111111"
                        value={form.phoneNumber || ""}
                        type="number"
                        onChange={(e) => updateForm('phoneNumber', e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        MR Number
                      </Label>
                      <div className="flex h-9 gap-2">
                        <Input
                          className="h-9 flex-1 rounded-md border border-skeuo-surface bg-white py-0 focus-visible:ring-2 focus-visible:ring-skeuo-red/20 focus-visible:border-skeuo-red"
                          placeholder="MR000123"
                          value={form.mrNumber || ""}
                          onChange={(e) => updateForm('mrNumber', e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <Button
                          type="button"
                          disabled={isFinding}
                          onClick={handleSearch}
                          className="h-full shrink-0 text-white rounded-md bg-skeuo-red px-6 font-bold hover:bg-skeuo-red-dark"
                        >
                          {isFinding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ---------- Personal info ---------- */}
                <section className="space-y-2.5 border-t border-skeuo-surface pt-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-skeuo-muted" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted">Personal Information</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        First Name <span className="text-skeuo-red">*</span>
                      </Label>
                      <Input
                        className="h-9 rounded-md border border-skeuo-surface bg-white py-0 focus-visible:ring-2 focus-visible:ring-skeuo-red/20 focus-visible:border-skeuo-red"
                        value={form.firstName || ""}
                        onChange={(e) => updateForm('firstName', e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">Last Name</Label>
                      <Input
                        className="h-9 rounded-md border border-skeuo-surface bg-white py-0 focus-visible:ring-2 focus-visible:ring-skeuo-red/20 focus-visible:border-skeuo-red"
                        value={form.lastName || ""}
                        onChange={(e) => updateForm('lastName', e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                      Gender <span className="text-skeuo-red">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {['Male', 'Female', 'Other'].map((g) => {
                        const active = form.gender === g;
                        return (
                          <button
                            type="button"
                            key={g}
                            onClick={() => updateForm('gender', g)}
                            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${active
                              ? 'border-skeuo-red bg-skeuo-red/10 text-skeuo-red'
                              : 'border-skeuo-surface bg-white text-skeuo-muted hover:border-skeuo-muted/40 hover:text-skeuo-text'
                              }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        Date of Birth <span className="text-skeuo-red">*</span>
                      </Label>
                      <Input
                        className="h-9 rounded-md border border-skeuo-surface bg-white py-0 focus-visible:ring-2 focus-visible:ring-skeuo-red/20 focus-visible:border-skeuo-red"
                        type="text"
                        inputMode="numeric"
                        placeholder="DD/MM/YYYY"
                        maxLength={10}
                        value={form.dob || ""}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/[^\d]/g, "");
                          if (raw.length >= 2) {
                            let day = parseInt(raw.slice(0, 2));
                            if (day > 31) day = 31;
                            if (day < 1 && raw.length === 2) day = 1;
                            raw = String(day).padStart(2, "0") + raw.slice(2);
                          }
                          if (raw.length >= 4) {
                            let month = parseInt(raw.slice(2, 4));
                            if (month > 12) month = 12;
                            if (month < 1 && raw.length >= 4) month = 1;
                            raw = raw.slice(0, 2) + String(month).padStart(2, "0") + raw.slice(4);
                          }
                          if (raw.length >= 8) {
                            const currentYear = new Date().getFullYear();
                            let year = parseInt(raw.slice(4, 8));
                            if (year > currentYear) year = currentYear;
                            raw = raw.slice(0, 4) + String(year);
                          }
                          let val = raw;
                          if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
                          if (val.length >= 6) val = val.slice(0, 5) + "/" + val.slice(5);
                          val = val.slice(0, 10);
                          updateForm('dob', val);
                        }}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        Age <span className="text-skeuo-red">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={form.age || ""}
                        onChange={(e) => updateForm('age', e.target.value)}
                        className="h-9 rounded-md border border-skeuo-surface bg-skeuo-base py-0 text-center font-bold text-skeuo-red focus-visible:ring-2 focus-visible:ring-skeuo-red/20 focus-visible:border-skeuo-red"
                      />
                    </div>
                  </div>
                </section>

                {/* ---------- Address ---------- */}
                <section className="space-y-2.5 border-t border-skeuo-surface pt-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-skeuo-muted" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted">Address &amp; Location</h3>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">Street Address</Label>
                    <Input
                      className="h-9 rounded-md border border-skeuo-surface bg-white py-0 focus-visible:ring-2 focus-visible:ring-skeuo-red/20 focus-visible:border-skeuo-red"
                      placeholder="House #, Street…"
                      value={form.stAddress || ""}
                      onChange={(e) => updateForm('stAddress', e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Country */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        Country <span className="text-skeuo-red">*</span>
                      </Label>
                      <Popover open={openCountry} onOpenChange={setOpenCountry}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 w-full justify-between rounded-md border border-skeuo-surface bg-white text-left text-sm font-normal hover:bg-skeuo-base">
                            <span className={form.country ? "truncate text-skeuo-text" : "truncate text-skeuo-muted"}>
                              {countries.find(c => c.isoCode === form.country)?.name || "Select Country…"}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-white" align="start">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {countries.map((c) => (
                                  <CommandItem key={c.isoCode} onSelect={() => { updateForm('country', c.isoCode); setOpenCountry(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", form.country === c.isoCode ? "opacity-100" : "opacity-0")} />
                                    {c.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Province */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        Province <span className="text-skeuo-red">*</span>
                      </Label>
                      <Popover open={openProvince} onOpenChange={setOpenProvince}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 w-full justify-between rounded-md border border-skeuo-surface bg-white text-left text-sm font-normal hover:bg-skeuo-base" disabled={!states.length}>
                            <span className={`truncate ${form.province ? "text-skeuo-text" : "text-skeuo-muted"}`}>
                              {states.find(s => s.isoCode === form.province)?.name || "Select Province…"}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-white" align="start">
                          <Command>
                            <CommandInput placeholder="Search province..." />
                            <CommandList>
                              <CommandEmpty>No province found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {states.map((s) => (
                                  <CommandItem key={s.isoCode} onSelect={() => { updateForm('province', s.isoCode); setOpenProvince(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", form.province === s.isoCode ? "opacity-100" : "opacity-0")} />
                                    {s.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-[0.12em] text-skeuo-muted md:text-sm">
                        City <span className="text-skeuo-red">*</span>
                      </Label>
                      <Popover open={openCity} onOpenChange={setOpenCity}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 w-full justify-between rounded-md border border-skeuo-surface bg-white text-left text-sm font-normal hover:bg-skeuo-base">
                            <span className={form.city ? "truncate text-skeuo-text" : "truncate text-skeuo-muted"}>
                              {form.city || "Select City…"}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-white" align="start">
                          <Command>
                            <CommandInput placeholder="Search city..." />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-y-auto">
                                {cities.map((city) => (
                                  <CommandItem key={city.name} onSelect={() => { updateForm('city', city.name); setOpenCity(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", form.city === city.name ? "opacity-100" : "opacity-0")} />
                                    {city.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </section>

                {/* ---------- Action bar ---------- */}
                <div className="flex items-center justify-between gap-3 border-t border-skeuo-surface pt-3">
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="h-10 w-10 rounded-full p-0 text-skeuo-muted hover:bg-skeuo-red/10 hover:text-skeuo-red"
                    title="Reset form"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>

                  <Button
                    disabled={isSaving}
                    onClick={handleNextStep}
                    className="flex items-center text-white gap-2 rounded-xl bg-skeuo-red px-8 py-3 text-base font-bold shadow-lg shadow-skeuo-red/25 transition-transform hover:bg-skeuo-red-dark active:scale-95 disabled:opacity-70 md:text-lg"
                  >
                    {isSaving ? (
                      <>Saving… <Loader2 className="h-5 w-5 animate-spin" /></>
                    ) : (
                      <>Next Step <ChevronRight className="h-5 w-5" /></>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </main>
      </NoRefreshScrollArea>

      {/* ================= Success dialog ================= */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-md text-center py-8 z-1000 bg-white">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Registration Successful</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Patient has been checked in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-5">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-skeuo-muted">Patient Token</p>
              <div className="rounded-2xl border-2 border-dashed border-skeuo-surface bg-skeuo-base py-4 text-6xl font-black text-skeuo-red">
                {token || "----"}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-skeuo-muted">MR Number</p>
              <div className="rounded-lg bg-skeuo-base py-2 text-lg font-bold text-skeuo-text">
                {mrNumber || "----"}
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowTokenDialog(false);
              resetForm();
            }}
            className="h-12 w-full bg-skeuo-red text-lg font-bold text-white hover:bg-skeuo-red-dark"
          >
            Done &amp; New Patient
          </Button>
        </DialogContent>
      </Dialog>

      {/* ================= Consent dialog ================= */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent
          className={cn(
            "mx-auto flex w-[calc(100%-2rem)] flex-col bg-white py-6 text-left transition-all sm:w-full sm:max-w-md",
            consentExpanded && "max-h-[90vh] sm:max-w-130"
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Terms and Conditions</DialogTitle>
            <DialogDescription className="text-sm text-skeuo-muted">
              Your consent for the medical information described in this form is required to proceed with the appointment.
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            onClick={() => setConsentExpanded(prev => !prev)}
            className="w-fit text-left text-xs font-medium italic text-skeuo-red hover:underline"
          >
            {consentExpanded ? "Click here to hide the Consent Form" : "Click here to show the Consent Form"}
          </button>

          {consentExpanded && (
            <div className="space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-skeuo-muted">
              <p>This notice describes how your medical information may be used and disclosed and how you can get access to this information. Please review it carefully.</p>
              <p>Protected health information refers to any personal information related to your health, healthcare treatment, and payment for healthcare services.</p>
              <p>We must follow the practices described in this notice, but we can change our privacy practices and the terms of this notice at any time.</p>
              <p>Completion of this form is voluntary and will not affect your treatment.</p>
            </div>
          )}

          <div className="mt-4 flex justify-center gap-3 border-t border-skeuo-surface pt-4">
            <Button variant="outline" onClick={handleConsentReject} className="flex-1">
              Reject
            </Button>
            <Button onClick={handleConsentAccept} disabled={isSaving} className="flex-1 text-white bg-skeuo-red hover:bg-skeuo-red-dark">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= Phone conflict dialog ================= */}
      <Dialog open={showPhoneConflictDialog} onOpenChange={setShowPhoneConflictDialog}>
        <DialogContent className="sm:max-w-md text-center py-8 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Phone Number Already Registered</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-skeuo-muted">
              This phone number is already linked to{' '}
              <span className="font-bold text-skeuo-text">
                {phoneConflictRecord?.fields?.firstName} {phoneConflictRecord?.fields?.lastName}
              </span>
              , but the details you've entered don't match that record. Do you want
              to update that patient's record with these new details, or use a
              different phone number instead?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={handleChangeNumber} className="flex-1">
              Change Number
            </Button>
            <Button onClick={handleConfirmUpdateExisting} className="flex-1 bg-skeuo-red hover:bg-skeuo-red-dark">
              Update Existing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemographicPage;