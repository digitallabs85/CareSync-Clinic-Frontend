//app/dashboard/video-call/[vitalsid]/PatientPrescriptionModal.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { X, Pill, FlaskConical, Stethoscope, NotebookText, User2, Activity, Loader2 } from 'lucide-react';
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
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">

                <div className="bg-[#0297d6] px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">Your Prescription</h2>
                        {report?.patient?.token && (
                            <p className="text-blue-100 text-xs mt-0.5">Token #{report.patient.token}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-slate-100">
                    {([
                        { key: 'prescription', label: 'Prescription', icon: Pill },
                        { key: 'vitals', label: 'Vitals & Tests', icon: Activity },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === key ? 'border-[#0297d6] text-[#0297d6]' : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-[#0297d6] animate-spin" />
                        </div>
                    ) : error ? (
                        <p className="text-center text-red-400 text-sm py-8">{error}</p>
                    ) : activeTab === 'prescription' ? (
                        !prescription ? (
                            <p className="text-center text-slate-400 text-sm py-8">No prescription has been issued yet.</p>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-9 h-9 rounded-full bg-[#0297d6]/10 flex items-center justify-center shrink-0">
                                        <User2 size={16} className="text-[#0297d6]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{prescription.doctor?.name ?? 'Doctor'}</p>
                                        {specializationsLabel(prescription.doctor?.specializations) && (
                                            <p className="text-xs text-slate-400">{specializationsLabel(prescription.doctor?.specializations)}</p>
                                        )}
                                    </div>
                                </div>

                                {prescription.diagnosis && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Stethoscope size={12} /> Diagnosis
                                        </p>
                                        <p className="text-sm text-slate-700 font-medium">{prescription.diagnosis}</p>
                                    </div>
                                )}

                                {prescription.medicines?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Pill size={12} /> Medicines
                                        </p>
                                        <div className="space-y-2">
                                            {prescription.medicines.map((m: any, i: number) => (
                                                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                                                        {m.dosage && <span>{m.dosage}</span>}
                                                        {m.duration && <span>{m.duration}</span>}
                                                        <span>{mealLabel(m)}</span>
                                                        <span>{scheduleLabel(m)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {prescription.hematologicalTest && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <FlaskConical size={12} /> Hematological Tests
                                        </p>
                                        <p className="text-sm text-slate-700 font-medium">{prescription.hematologicalTest}</p>
                                    </div>
                                )}

                                {prescription.radiologicalTest && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <FlaskConical size={12} /> Radiological Tests
                                        </p>
                                        <p className="text-sm text-slate-700 font-medium">{prescription.radiologicalTest}</p>
                                    </div>
                                )}

                                {prescription.clinicalNotes && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <NotebookText size={12} /> Clinical Notes
                                        </p>
                                        <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{prescription.clinicalNotes}</p>
                                    </div>
                                )}

                                <div className="text-xs text-slate-400 text-center pt-2 space-y-0.5">
                                    <p>Issued {prescription.prescriptionDate} {prescription.prescriptionTime ?? ''}</p>
                                    {prescription.updatedAt && (
                                        <p>Updated {new Date(prescription.updatedAt).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vitals</p>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Temperature', value: temperature?.value, unit: temperature?.unit ?? '' },
                                        { label: 'Blood Pressure', value: vitals?.Systolic && vitals?.Diastolic ? `${vitals.Systolic}/${vitals.Diastolic}` : null, unit: 'mmHg' },
                                        { label: 'Pulse', value: vitals?.PulseRate, unit: 'bpm' },
                                        { label: 'SpO2', value: vitals?.BloodOxygen, unit: '%' },
                                        { label: 'Weight', value: vitals?.Weight, unit: 'kg' },
                                        { label: 'Height', value: height?.value, unit: height?.unit ?? '' },
                                        { label: 'BMI', value: vitals?.bmi, unit: '' },
                                    ].map(({ label, value, unit }) => (
                                        <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                                            <span className={`text-sm font-bold ${value ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {value ? `${value} ${unit}`.trim() : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {rapid && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rapid Testing</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(rapid)
                                            .filter(([k]) => !['id', 'vitals_id', 'createdDate', 'createdTime'].includes(k))
                                            .map(([k, v]) => (
                                                <div key={k} className="p-2.5 bg-slate-50 rounded-lg">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{k}</p>
                                                    <p className="text-xs font-bold text-slate-700">{String(v)}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {eye && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Eye Testing</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                                        <div className="p-2.5 bg-slate-50 rounded-lg">Left Eye: {eye.leftEyeResult}</div>
                                        <div className="p-2.5 bg-slate-50 rounded-lg">Right Eye: {eye.rightEyeResult}</div>
                                    </div>
                                </div>
                            )}

                            {colorBlind && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Color Blind Test</p>
                                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-700">
                                        Result: {colorBlind.colorBlindResult}
                                    </div>
                                </div>
                            )}

                            {hearing && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hearing Test</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                                        <div className="p-2.5 bg-slate-50 rounded-lg">Left Ear: {hearing.leftEarResult}</div>
                                        <div className="p-2.5 bg-slate-50 rounded-lg">Right Ear: {hearing.rightEarResult}</div>
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