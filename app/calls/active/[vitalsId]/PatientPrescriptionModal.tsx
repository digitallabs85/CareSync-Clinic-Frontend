//app/dashboard/video-call/[vitalsid]/PatientPrescriptionModal.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { X, Pill, FlaskConical, Stethoscope, NotebookText, User2, Activity, Loader2, FileText, AlertCircle } from 'lucide-react';
import { apiService } from '@/app/_utils/apiService';
import { formatTemperature, formatHeight } from '@/app/_utils/unitConversions';

interface PatientPrescriptionModalProps {
    onClose: () => void;
    vitalsId: string;
}

export const PatientPrescriptionModal = ({ onClose, vitalsId }: PatientPrescriptionModalProps) => {
    const [activeTab, setActiveTab] = useState<'prescription' | 'vitals'>('prescription');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await apiService.getFullReport(vitalsId);
                if (mounted) setReport(res.data);
            } catch (err: any) {
                if (mounted) setError(err.message || 'Failed to load prescription');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [vitalsId]);


    const prescription = report?.prescription;
    const vitals = report?.vitals;
    const temperature = formatTemperature(vitals?.Temperature, vitals?.temperatureUnit);
    const height = formatHeight(vitals?.Height, vitals?.heightUnit);
    const rapid = report?.rapidTesting;
    const eye = report?.eyeTesting;
    const colorBlind = report?.colorBlindTesting;
    const hearing = report?.hearingTesting;

    const mealLabel = (m: any) => (m?.beforeMeal ? 'Before Meal' : 'After Meal');
    const scheduleLabel = (m: any) => {
        const parts: string[] = [];
        if (m?.morning) parts.push('Morning');
        if (m?.afternoon) parts.push('Afternoon');
        if (m?.night) parts.push('Night');
        return parts.length ? parts.join(', ') : '—';
    };
    const specializationsLabel = (spec: any) => {
        if (!Array.isArray(spec) || spec.length === 0) return null;
        return spec.map((s) => (typeof s === 'string' ? s : s?.name ?? '')).filter(Boolean).join(', ');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl animate-fade-in">

                {/* ================= Header (Sticky) ================= */}
                <div className="sticky top-0 z-20 flex flex-col border-b border-slate-200 bg-white/90 px-4 pb-2 pt-3 backdrop-blur-md sm:px-5 sm:pb-3 sm:pt-4 rounded-t-[2rem]">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="flex items-center gap-3 text-base font-black text-slate-800 sm:text-lg">
                            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#0297d6]/10 text-[#0297d6] sm:h-10 sm:w-10">
                                <FileText size={18} />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span>Your Prescription</span>
                                {report?.patient?.token && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                                        Token #{report.patient.token}
                                    </span>
                                )}
                            </div>
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Sleek Pill Tabs */}
                    <div className="flex gap-2">
                        {([
                            { key: 'prescription', label: 'Prescription', icon: Pill },
                            { key: 'vitals', label: 'Vitals & Tests', icon: Activity },
                        ] as const).map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all sm:py-2.5 ${activeTab === key
                                        ? 'bg-[#0297d6] text-white shadow-md shadow-[#0297d6]/20'
                                        : 'bg-slate-50/80 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                    }`}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ================= Body Content ================= */}
                <div className="px-3 py-4 sm:px-5 sm:py-5">
                    {loading ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-3">
                            <Loader2 className="h-7 w-7 animate-spin text-[#0297d6]" />
                            <span className="text-sm font-bold text-slate-400">Loading details...</span>
                        </div>
                    ) : error ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-3">
                            <AlertCircle className="h-7 w-7 text-rose-400" />
                            <span className="text-sm font-bold text-rose-400">{error}</span>
                        </div>
                    ) : activeTab === 'prescription' ? (
                        !prescription ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-3">
                                <FileText className="h-8 w-8 text-slate-200" />
                                <span className="text-sm font-bold text-slate-400">No prescription issued yet.</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Doctor Info */}
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Issued By</p>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0297d6]/10 text-[#0297d6]">
                                            <User2 size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{prescription.doctor?.name ?? 'Doctor'}</p>
                                            {specializationsLabel(prescription.doctor?.specializations) && (
                                                <p className="text-xs font-semibold text-slate-400">{specializationsLabel(prescription.doctor?.specializations)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                {prescription.diagnosis && (
                                    <div>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <Stethoscope size={12} /> Diagnosis
                                        </p>
                                        <div className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700">
                                            {prescription.diagnosis}
                                        </div>
                                    </div>
                                )}

                                {/* Medicines */}
                                {prescription.medicines?.length > 0 && (
                                    <div>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <Pill size={12} /> Medicines
                                        </p>
                                        <div className="space-y-2.5">
                                            {prescription.medicines.map((m: any, i: number) => (
                                                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
                                                    <p className="mb-2 text-sm font-black text-slate-800">{m.name}</p>
                                                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
                                                        {m.dosage && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">{m.dosage}</span>}
                                                        {m.duration && <span className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">{m.duration}</span>}
                                                        <span className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">{mealLabel(m)}</span>
                                                        <span className="rounded-lg border border-[#0297d6]/20 bg-[#0297d6]/10 px-2.5 py-1 text-[10px] font-bold text-[#0297d6]">{scheduleLabel(m)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hematological */}
                                {prescription.hematologicalTest && (
                                    <div>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <FlaskConical size={12} /> Hematological Tests
                                        </p>
                                        <div className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700">
                                            {prescription.hematologicalTest}
                                        </div>
                                    </div>
                                )}

                                {/* Radiological */}
                                {prescription.radiologicalTest && (
                                    <div>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <FlaskConical size={12} /> Radiological Tests
                                        </p>
                                        <div className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700">
                                            {prescription.radiologicalTest}
                                        </div>
                                    </div>
                                )}

                                {/* Clinical Notes */}
                                {prescription.clinicalNotes && (
                                    <div>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <NotebookText size={12} /> Clinical Notes
                                        </p>
                                        <div className="whitespace-pre-wrap rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700">
                                            {prescription.clinicalNotes}
                                        </div>
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="mt-4 border-t border-slate-100 pt-4 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Issued {prescription.prescriptionDate} {prescription.prescriptionTime ?? ''}
                                    </p>
                                    {prescription.updatedAt && (
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                                            Updated {new Date(prescription.updatedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="space-y-4">
                            {/* Vitals */}
                            <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Vitals</p>
                                <div className="rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
                                    {[
                                        { label: 'Temperature', value: temperature?.value, unit: temperature?.unit ?? '' },
                                        { label: 'Blood Pressure', value: vitals?.Systolic && vitals?.Diastolic ? `${vitals.Systolic}/${vitals.Diastolic}` : null, unit: 'mmHg' },
                                        { label: 'Pulse', value: vitals?.PulseRate, unit: 'bpm' },
                                        { label: 'SpO2', value: vitals?.BloodOxygen, unit: '%' },
                                        { label: 'Weight', value: vitals?.Weight, unit: 'kg' },
                                        { label: 'Height', value: height?.value, unit: height?.unit ?? '' },
                                        { label: 'BMI', value: vitals?.bmi, unit: '' },
                                    ].map(({ label, value, unit }) => (
                                        <div key={label} className="flex items-center justify-between border-b border-slate-50 px-3 py-2 last:border-0">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                                            <span className={`text-sm font-black ${value ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {value ? `${value} ${unit}`.trim() : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rapid Testing */}
                            {rapid && (
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Rapid Testing</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(rapid)
                                            .filter(([k]) => !['id', 'vitals_id', 'createdDate', 'createdTime'].includes(k))
                                            .map(([k, v]) => (
                                                <div key={k} className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-3">
                                                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{k}</p>
                                                    <p className="text-sm font-black text-slate-800">{String(v)}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Eye Testing */}
                            {eye && (
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Eye Testing</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-3">
                                            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Left Eye</p>
                                            <p className="text-sm font-black text-slate-800">{eye.leftEyeResult}</p>
                                        </div>
                                        <div className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-3">
                                            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Right Eye</p>
                                            <p className="text-sm font-black text-slate-800">{eye.rightEyeResult}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Color Blind Test */}
                            {colorBlind && (
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Color Blind Test</p>
                                    <div className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-3">
                                        <p className="text-sm font-black text-slate-800">Result: {colorBlind.colorBlindResult}</p>
                                    </div>
                                </div>
                            )}

                            {/* Hearing Test */}
                            {hearing && (
                                <div>
                                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Hearing Test</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-3">
                                            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Left Ear</p>
                                            <p className="text-sm font-black text-slate-800">{hearing.leftEarResult}</p>
                                        </div>
                                        <div className="rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-3">
                                            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Right Ear</p>
                                            <p className="text-sm font-black text-slate-800">{hearing.rightEarResult}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};