// //app/dashboard/pharmacy/page.tsx
// 'use client'
// import { Loader2, Pill, Printer, Mail, FileDown, ChevronDown, X, MessageCircle } from 'lucide-react'
// import Navbar from '../_components/Navbar'
// import React, { useState, useEffect, useCallback } from 'react'
// import { apiService } from '@/app/_utils/apiService';
// import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge';
// import type { PrescriptionWithPatient } from "@/app/_utils/types";
// import { BluetoothPrinterModal } from '../consultation/components/BluetoothPrinterModel';
// import { downloadPDF } from '@/app/_utils/pdfExport';
// import { usePageGuard } from '@/app/_utils/usePageGuard';
// import { COUNTRY_DIAL_CODES, CountryDialInfo, resolveCountryAndLocal, validatePhoneForCountry, buildWhatsAppLink } from '@/app/_utils/whatsapp';
// import { CountryCodeSelect } from '../_components/CountryCodeSelect';
// import app from '@/app.json'


// const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// // ── Strip a leading "Other:" / "Other :" prefix from stored custom values ──
// const stripOtherPrefix = (value: any): string => {
//     if (typeof value !== 'string') return value;
//     return value.replace(/^other\s*:\s*/i, '').trim();
// };

// // ── Helpers (mirror VitalReportModal) ──────────────────────────────────────
// const shouldShow = (value: any): boolean => {
//     if (value == null) return false;
//     if (typeof value === 'string') {
//         const trimmed = value.trim();
//         if (trimmed === '') return false;
//         const lower = trimmed.toLowerCase();
//         if (lower === 'not performed' || lower === 'unknown') return false;
//     }
//     return true;
// };

// const shortenResult = (value: any): string => {
//     if (
//         typeof value === 'string' &&
//         value.trim().toLowerCase() === 'consultation required'
//     ) {
//         return 'Consult Req';
//     }
//     return value;
// };

// const formatHeight = (height: string, unit?: string): string => {
//     if (!height) return '—';
//     const num = parseFloat(height);
//     if (isNaN(num)) return height;
//     // DB always stores height in cm — convert to ft/in for display when unit isn't 'cm'
//     if (unit === 'cm' || !unit) return `${num.toFixed(0)} cm`;
//     const totalInches = num / 2.54;
//     const ft = Math.floor(totalInches / 12);
//     const inch = Math.round(totalInches % 12);
//     return `${ft}ft ${inch}in`;
// };

// const formatTemperature = (temp: string, unit?: string): string => {
//     const num = parseFloat(temp);
//     if (isNaN(num)) return temp;
//     // DB always stores temperature in °C — convert to °F for display when that's the stored unit
//     if (unit === '°F') return `${((num * 9 / 5) + 32).toFixed(1)}°F`;
//     return `${num.toFixed(1)}°C`;
// };

// const formatUpdatedAt = (dt?: string | Date): string => {
//     if (!dt) return '';
//     const parsed = new Date(dt);
//     if (isNaN(parsed.getTime())) return '';
//     return parsed.toLocaleString(undefined, {
//         year: 'numeric', month: 'short', day: 'numeric',
//         hour: '2-digit', minute: '2-digit',
//     });
// };

// // ── Row & SectionTitle ──────────────────────────────────────────────────────
// const Row = ({ label, value }: { label: string; value: string }) => (
//     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
//         <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#555', letterSpacing: 1 }}>{label}</span>
//         <span style={{ fontWeight: 800, color: '#111' }}>{value}</span>
//     </div>
// );

// const SectionTitle = ({ title }: { title: string }) => (
//     <div style={{
//         fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2,
//         color: '#0297d6', borderBottom: '1px solid #0297d6', paddingBottom: 8, marginBottom: 6, marginTop: 10
//     }}>
//         {title}
//     </div>
// );

// // ── Medicine schedule helper ─────────────────────────────────────────────
// const formatSchedule = (m: any) => {
//     const schedule = `${m.morning ? 1 : 0}-${m.afternoon ? 1 : 0}-${m.night ? 1 : 0}`;
//     const meal = m.beforeMeal ? 'Before Meal' : m.afterMeal ? 'After Meal' : '';
//     return meal ? `${schedule} · ${meal}` : schedule;
// };

// // ── Rapid testing field configuration (same as VitalReportModal) ──────────
// const rapidFields = [
//     { key: 'bloodSugar', label: 'Blood Sugar', unit: 'mg/dL' },
//     { key: 'ecg', label: 'ECG', unit: '' },
//     { key: 'hiv', label: 'HIV', unit: '' },
//     { key: 'hepatitis', label: 'Hepatitis', unit: '' },
//     { key: 'hbsag', label: 'HBsAg', unit: '' },
//     { key: 'hcvAb', label: 'HCV Ab', unit: '' },
//     { key: 'hivAb', label: 'HIV Ab', unit: '' },
//     { key: 'dengueNs1Ag', label: 'Dengue NS1 Ag', unit: '' },
//     { key: 'syphilisAb', label: 'Syphilis Ab', unit: '' },
//     { key: 'typhoidAb', label: 'Typhoid Ab', unit: '' },
//     { key: 'tuberculosis', label: 'Tuberculosis', unit: '' },
//     { key: 'malariaPfPvAg', label: 'Malaria Pf/Pv Ag', unit: '' },
//     { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
//     { key: 'cholesterol', label: 'Cholesterol', unit: 'mg/dL' },
//     { key: 'bodyFat', label: 'Body Fat', unit: '%' },
// ];

// const Page = () => {
//     const allowed = usePageGuard('pharmacy');

//     const [queue, setQueue] = useState<PrescriptionWithPatient[]>([]);
//     const [search, setSearch] = useState("");
//     const [loadingQueue, setLoadingQueue] = useState(false);

//     // ── Modal state ────────────────────────────────────────────────────────
//     const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithPatient | null>(null);
//     const [isModalOpen, setIsModalOpen] = useState(false);

//     // ── Full report data (fetched once on page load) ──────────────────────
//     const [fullReport, setFullReport] = useState<any>(null);
//     const [loadingReport, setLoadingReport] = useState(false);

//     // ── Action states (inside modal) ──────────────────────────────────────
//     const [isPrinting, setIsPrinting] = useState(false);
//     const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
//     const [isSavingPdf, setIsSavingPdf] = useState(false);
//     const [isDispensing, setIsDispensing] = useState(false);
//     const [showActionDropdown, setShowActionDropdown] = useState(false);

//     // ── Email states (inside modal) ──────────────────────────────────────
//     const [isSendingEmail, setIsSendingEmail] = useState(false);
//     const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'found' | 'not_found' | 'sent' | 'error'>('idle');
//     const [patientEmail, setPatientEmail] = useState<string | null>(null);
//     const [showEmailConfirm, setShowEmailConfirm] = useState(false);
//     const [isEditingEmail, setIsEditingEmail] = useState(false);
//     const [editedEmail, setEditedEmail] = useState('');
//     const [noEmailInput, setNoEmailInput] = useState('');
//     const [isSavingEmail, setIsSavingEmail] = useState(false);

//     // ── WhatsApp states ──
//     const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sent' | 'error'>('idle');
//     const [showWhatsappConfirm, setShowWhatsappConfirm] = useState(false);
//     const [waCountry, setWaCountry] = useState<CountryDialInfo>(COUNTRY_DIAL_CODES[0]);
//     const [waLocalNumber, setWaLocalNumber] = useState('');
//     const [waError, setWaError] = useState<string | null>(null);

//     // ── Load queue ──────────────────────────────────────────────────────────
//     const loadQueue = async () => {
//         setLoadingQueue(true);
//         try {
//             const res = await apiService.getAllPrescription();
//             setQueue(res.data || []);
//         } catch (err) {
//             console.error("Failed to load prescriptions", err);
//         } finally {
//             setLoadingQueue(false);
//         }
//     };

//     useEffect(() => {
//         loadQueue();
//     }, []);

//     // ── Fetch full report for the SELECTED prescription's patient ─────────
//     useEffect(() => {
//         if (!isModalOpen || !selectedPrescription) {
//             setFullReport(null);
//             return;
//         }

//         const fetchReport = async () => {
//             setLoadingReport(true);
//             try {
//                 const patientId = (selectedPrescription as any).patient_id || selectedPrescription.patient.id;
//                 const token = selectedPrescription.token;

//                 if (!patientId || !token) {
//                     setFullReport(null);
//                     return;
//                 }

//                 // Resolve this exact visit's vitalsId from patient_id + token
//                 const vitalRes = await apiService.getLatestVitals(String(patientId), String(token));
//                 const vitalsId = vitalRes?.vital?.id;

//                 if (!vitalsId) {
//                     setFullReport(null);
//                     return;
//                 }

//                 const res = await apiService.getFullReport(vitalsId);
//                 if (res.success && res.data) {
//                     setFullReport(res.data);
//                 } else {
//                     setFullReport(null);
//                 }
//             } catch (err) {
//                 console.error('Failed to fetch report:', err);
//                 setFullReport(null);
//             } finally {
//                 setLoadingReport(false);
//             }
//         };
//         fetchReport();
//     }, [selectedPrescription, isModalOpen]);

//     // ── Reset modal states when closed ─────────────────────────────────────
//     useEffect(() => {
//         if (!isModalOpen) {
//             setShowActionDropdown(false);
//             setEmailStatus('idle');
//             setShowEmailConfirm(false);
//             setIsEditingEmail(false);
//             setPatientEmail(null);
//             setSelectedPrescription(null);
//             setFullReport(null);
//             // Keep fullReport – it's page‑level data
//         }
//     }, [isModalOpen]);

//     // ── Android print callback ─────────────────────────────────────────────
//     useEffect(() => {
//         (window as any).onPrintResult = (success: boolean, message: string) => {
//             setIsPrinting(false);
//             setIsPrinterModalOpen(false);

//         };
//         return () => { delete (window as any).onPrintResult; };
//     }, []);

//     // ── Filtered queue ─────────────────────────────────────────────────────
//     const filteredPrescriptions = queue.filter((item) => {
//         if (!search) return true;
//         const q = search.toLowerCase();
//         const full = `${item.patient.firstName || ""} ${item.patient.lastName || ""}`.toLowerCase();
//         const rev = `${item.patient.lastName || ""} ${item.patient.firstName || ""}`.toLowerCase();
//         return full.includes(q) || rev.includes(q) || String(item.token || "").toLowerCase().includes(q);
//     });

//     const getHematologicalTests = (p: PrescriptionWithPatient) => {
//         return p.hematologicalTest ? p.hematologicalTest.split(',').map((t: string) => stripOtherPrefix(t.trim())).filter(Boolean) : [];
//     };
//     const getRadiologicalTests = (p: PrescriptionWithPatient) => {
//         return p.radiologicalTest ? p.radiologicalTest.split(',').map((t: string) => stripOtherPrefix(t.trim())).filter(Boolean) : [];
//     };

//     // ── WhatsApp message builder ──
//     const buildWhatsappMessage = (): string | null => {
//         const p = selectedPrescription;
//         if (!p) return null;
//         const lines: string[] = [];

//         lines.push(app.name);
//         lines.push('_Prescription & Report_');
//         lines.push('');
//         lines.push(`*Patient:* ${p.patient.firstName} ${p.patient.lastName}`);
//         if (p.patient.age) lines.push(`*Age/Sex:* ${p.patient.age}Y / ${p.patient.gender ?? ''}`);
//         lines.push(`*Token:* #${p.token}`);
//         lines.push(`*Date:* ${p.prescriptionDate ? new Date(p.prescriptionDate).toLocaleDateString() : new Date().toLocaleDateString()}`);

//         if ((p as any).doctor) {
//             const doc = (p as any).doctor;
//             lines.push('');
//             lines.push(`*Doctor:* ${doc.title || ''} ${doc.firstName || ''} ${doc.lastName || ''}`.trim());
//             if (doc.specializations?.length) lines.push(`*Specialization:* ${doc.specializations.join(', ')}`);
//         }

//         // ── Vitals + rapid testing (from fullReport) ──
//         if (fullReport) {
//             const v = fullReport.vitals;
//             const vitalLines: string[] = [];
//             if (shouldShow(v.Systolic) && shouldShow(v.Diastolic)) vitalLines.push(`BP: ${v.Systolic}/${v.Diastolic} mmHg`);
//             if (shouldShow(v.BloodOxygen)) vitalLines.push(`SpO2: ${v.BloodOxygen}%`);
//             if (shouldShow(v.PulseRate)) vitalLines.push(`Pulse: ${v.PulseRate} bpm`);
//             if (shouldShow(v.Temperature)) vitalLines.push(`Temp: ${formatTemperature(v.Temperature, v.temperatureUnit)}`);
//             if (shouldShow(v.Weight)) vitalLines.push(`Weight: ${v.Weight} kg`);
//             if (shouldShow(v.Height)) vitalLines.push(`Height: ${formatHeight(v.Height, v.heightUnit)}`);
//             if (shouldShow(v.bmi)) vitalLines.push(`BMI: ${v.bmi}`);
//             if (vitalLines.length) {
//                 lines.push('');
//                 lines.push('*VITALS*');
//                 lines.push(...vitalLines);
//             }

//             const rt = fullReport.rapidTesting;
//             if (rt) {
//                 const unitMap: Record<string, string> = { bloodSugar: 'mg/dL', cholesterol: 'mg/dL', bodyFat: '%', hemoglobin: 'g/dL' };
//                 const rapidLines: string[] = [];
//                 rapidFields.forEach(f => {
//                     if (!shouldShow(rt[f.key])) return;
//                     const val = shortenResult(rt[f.key]);
//                     const unit = f.unit ? ` ${f.unit}` : '';
//                     rapidLines.push(`${f.label}: ${val}${unit}`);
//                 });
//                 if (rapidLines.length) {
//                     lines.push('');
//                     lines.push('*RAPID TESTING*');
//                     lines.push(...rapidLines);
//                 }
//                 if (shouldShow(rt.ecgLink)) {
//                     lines.push('');
//                     lines.push(`📄 *ECG Report:* ${rt.ecgLink}`);
//                 }
//             }

//             const et = fullReport.eyeTesting;
//             if (et && (shouldShow(et.leftEyeResult) || shouldShow(et.rightEyeResult))) {
//                 lines.push('');
//                 lines.push('*EYE SCREENING*');
//                 if (shouldShow(et.leftEyeResult)) lines.push(`Left Eye: ${shortenResult(et.leftEyeResult)}`);
//                 if (shouldShow(et.rightEyeResult)) lines.push(`Right Eye: ${shortenResult(et.rightEyeResult)}`);
//             }

//             const cb = fullReport.colorBlindTesting;
//             if (cb && shouldShow(cb.colorBlindResult)) {
//                 lines.push('');
//                 lines.push('*COLOR BLIND SCREENING*');
//                 lines.push(`Result: ${shortenResult(cb.colorBlindResult)}`);
//             }

//             const ht = fullReport.hearingTesting;
//             if (ht && (shouldShow(ht.leftEarResult) || shouldShow(ht.rightEarResult))) {
//                 lines.push('');
//                 lines.push('*HEARING SCREENING*');
//                 if (shouldShow(ht.leftEarResult)) lines.push(`Left Ear: ${shortenResult(ht.leftEarResult)}`);
//                 if (shouldShow(ht.rightEarResult)) lines.push(`Right Ear: ${shortenResult(ht.rightEarResult)}`);
//             }

//             if (shouldShow(v.symptoms)) {
//                 lines.push('');
//                 lines.push('*SYMPTOMS*');
//                 lines.push(typeof v.symptoms === 'string' ? v.symptoms : v.symptoms.join(', '));
//             }
//         }

//         // ── Diagnosis ──
//         if (p.diagnosis) {
//             lines.push('');
//             lines.push('*DIAGNOSIS*');
//             lines.push(stripOtherPrefix(p.diagnosis));
//         }

//         // ── Medicines ──
//         const meds = (p.medicines ?? []).filter((m: any) => m.medicineName);
//         if (meds.length) {
//             lines.push('');
//             lines.push('*PRESCRIBED MEDICINES*');
//             meds.forEach((m: any, idx: number) => {
//                 lines.push(`${idx + 1}. ${m.medicineName} — ${m.dosage || '—'} · ${m.duration || '—'} (${formatSchedule(m)})`);
//             });
//         }

//         // ── Tests ──
//         const hemat = getHematologicalTests(p);
//         if (hemat.length) {
//             lines.push('');
//             lines.push('*HEMATOLOGICAL TESTS*');
//             lines.push(hemat.join(', '));
//         }
//         const radio = getRadiologicalTests(p);
//         if (radio.length) {
//             lines.push('');
//             lines.push('*RADIOLOGICAL TESTS*');
//             lines.push(radio.join(', '));
//         }

//         if (p.clinicalNotes) {
//             lines.push('');
//             lines.push('*CLINICAL NOTES*');
//             lines.push(p.clinicalNotes);
//         }

//         lines.push('');
//         lines.push(`_This digital report from ${app.name} does not require stamp or signature and is not valid for legal proceedings._`)
//         lines.push('')
//         lines.push(`Thank you for using ${app.name} Digital Health.`)
//         lines.push('For more information or assistance, please contact us:')
//         lines.push(`info@${app.name.toLowerCase()}.com`)
//         lines.push(`'https://www.${app.name.toLowerCase()}.com'`)

//         return lines.join('\n');
//     };

//     const handleOpenWhatsapp = () => {
//         setShowActionDropdown(false);
//         setWhatsappStatus('idle');
//         setWaError(null);
//         const resolved = resolveCountryAndLocal(
//             (selectedPrescription?.patient as any)?.countryCode,
//             selectedPrescription?.patient?.phoneNumber
//         );
//         setWaCountry(resolved.country);
//         setWaLocalNumber(resolved.local);
//         setShowWhatsappConfirm(true);
//     };

//     const handleConfirmSendWhatsapp = () => {
//         setWaError(null);
//         const check = validatePhoneForCountry(waLocalNumber, waCountry);
//         if (!check.valid) {
//             setWaError(check.message || 'Invalid phone number');
//             return;
//         }
//         const message = buildWhatsappMessage();
//         if (!message) {
//             setWhatsappStatus('error');
//             setTimeout(() => setWhatsappStatus('idle'), 3000);
//             return;
//         }
//         const waLink = buildWhatsAppLink(waCountry, waLocalNumber, message);
//         window.open(waLink, '_blank');
//         setWhatsappStatus('sent');
//         setShowWhatsappConfirm(false);
//         setTimeout(() => setWhatsappStatus('idle'), 3000);
//     };
//     // ── Modal actions (unchanged) ──────────────────────────────────────────
//     const handleWebPrint = () => {
//         const el = document.getElementById('prescription-paper-modal');
//         if (!el) return;
//         const win = window.open('', '_blank', 'width=420,height=900');
//         if (!win) return;
//         win.document.write(`
//       <html><head><title>Prescription</title>
//       <style>
//         *{margin:0;padding:0;box-sizing:border-box}
//         body{font-family:monospace;background:#fff;color:#111;padding:16px;width:340px;margin:0 auto}
//         img{display:block;margin:0 auto 4px;height:48px}
//       </style></head><body>
//       ${el.innerHTML}
//       <script>window.onload=()=>{window.print();window.close()}<\/script>
//       </body></html>
//     `);
//         win.document.close();
//     };

//     const handlePrint = () => {
//         if (!window.AndroidNative) { handleWebPrint(); return; }
//         setIsPrinting(false);          // force-clear any stale state from a previous attempts
//         setIsPrinterModalOpen(true);
//     };

//     const RANGE_PREFIX = "~";

//     const buildPrescriptionSections = (fullReport: any) => {
//         const sections: string[] = [];
//         const { vitals, rapidTesting } = fullReport;   // assume these exist

//         const getRangeLines = (field: string): string[] => {
//             const map: Record<string, string[]> = {
//                 BloodOxygen: ['SpO2: 90-100%'],
//                 PulseRate: ['Pulse: 40-100'],
//                 bmi: ['BMI: 18.5-24.9'],
//                 bloodSugarR: ['Blood Sugar Random: 80-180 mg/dL'],
//                 bloodSugarF: ['Blood Sugar Fasting: 80-120 mg/dL'],
//             };
//             return map[field] || [];
//         };

//         const shouldShow = (val: any) => val !== undefined && val !== null && val !== '';
//         const shortenResult = (val: any) => String(val); // adapt as needed
//         const formatHeight = (h: any, unit: any) => `${h} ${unit || 'cm'}`; // adapt

//         const combinedVitalsLines: string[] = [];

//         // 1. Blood Sugar (if you want it first)
//         if (rapidTesting?.bloodSugar) {
//             const sugar = rapidTesting.bloodSugar;
//             combinedVitalsLines.push(`Blood Sugar: ${sugar} mg/dL`);
//             getRangeLines('bloodSugarR').forEach(rl => combinedVitalsLines.push(`${RANGE_PREFIX}${rl}`));
//         }

//         // 2. Standard vitals
//         if (vitals.Systolic && vitals.Diastolic) {
//             combinedVitalsLines.push(`BP: ${vitals.Systolic}/${vitals.Diastolic} mmHg`);
//             combinedVitalsLines.push(`${RANGE_PREFIX}Systolic: 120-140`);
//             combinedVitalsLines.push(`${RANGE_PREFIX}Diastolic: 80-90`);
//         }
//         if (shouldShow(vitals.BloodOxygen)) {
//             combinedVitalsLines.push(`SpO2: ${vitals.BloodOxygen}%`);
//             getRangeLines('BloodOxygen').forEach(rl => combinedVitalsLines.push(`${RANGE_PREFIX}${rl}`));
//         }
//         if (shouldShow(vitals.PulseRate)) {
//             combinedVitalsLines.push(`Pulse: ${vitals.PulseRate} bpm`);
//             getRangeLines('PulseRate').forEach(rl => combinedVitalsLines.push(`${RANGE_PREFIX}${rl}`));
//         }
//         if (shouldShow(vitals.Temperature)) {
//             const t = parseFloat(vitals.Temperature);
//             const tempDisplay = isNaN(t)
//                 ? vitals.Temperature
//                 : vitals.temperatureUnit === '°F'
//                     ? `${((t * 9 / 5) + 32).toFixed(1)}°F`
//                     : `${t.toFixed(1)}°C`;
//             combinedVitalsLines.push(`Temp: ${tempDisplay}`);
//         }
//         if (shouldShow(vitals.Weight)) {
//             combinedVitalsLines.push(`Weight: ${vitals.Weight} kg`);
//         }
//         if (shouldShow(vitals.Height)) {
//             combinedVitalsLines.push(`Height: ${formatHeight(vitals.Height, vitals.heightUnit)}`);
//         }
//         if (shouldShow(vitals.bmi)) {
//             combinedVitalsLines.push(`BMI: ${vitals.bmi}`);
//             getRangeLines('bmi').forEach(rl => combinedVitalsLines.push(`${RANGE_PREFIX}${rl}`));
//         }

//         // 3. Other rapid tests (if any)
//         if (rapidTesting) {
//             const unitMap: Record<string, string> = {
//                 cholesterol: 'mg/dL',
//                 bodyFat: '%',
//                 hemoglobin: 'g/dL',
//             };
//             const allRapidFields = [
//                 'ecg', 'hiv', 'hepatitis', 'hbsag', 'hcvAb', 'hivAb',
//                 'dengueNs1Ag', 'syphilisAb', 'typhoidAb', 'tuberculosis', 'malariaPfPvAg',
//                 'hemoglobin', 'cholesterol', 'bodyFat'
//             ];
//             allRapidFields.forEach(field => {
//                 if (!shouldShow(rapidTesting[field])) return;
//                 const raw = rapidTesting[field];
//                 const val = shortenResult(raw);
//                 const unit = unitMap[field] ? ` ${unitMap[field]}` : '';
//                 const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
//                 combinedVitalsLines.push(`${label}: ${val}${unit}`);
//             });
//         }

//         if (combinedVitalsLines.length) {
//             sections.push('--- VITALS ---\n' + combinedVitalsLines.join('\n'));
//         }

//         return sections;
//     };

//     const executePrint = useCallback(() => {
//         const p = selectedPrescription;
//         if (!p) return;

//         setIsPrinting(true);
//         setTimeout(() => {
//             try {
//                 if (!(window as any).AndroidNative) {
//                     handleWebPrint();
//                     return;
//                 }

//                 const printPayload = {
//                     clinicName: app.name,
//                     date: new Date().toLocaleDateString(),
//                     prescriptionTime: (p as any).prescriptionTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//                     updatedAt: (p as any).updatedAt ? formatUpdatedAt((p as any).updatedAt) : null,
//                     token: p.token || "N/A",
//                     patient: {
//                         name: `${p.patient.firstName} ${p.patient.lastName}`,
//                         ageSex: `${p.patient.age ?? ''}Y / ${p.patient.gender ?? ''}`,
//                         phone: `${p.patient.phoneNumber ?? ''}`,
//                     },
//                     doctor: {
//                         name: `${(p as any).doctor?.title || ''} ${(p as any).doctor?.firstName || ''} ${(p as any).doctor?.lastName || ''}`.trim(),
//                         qualifications: Array.isArray((p as any).doctor?.qualifications)
//                             ? (p as any).doctor.qualifications.join(', ')
//                             : (p as any).doctor?.qualifications || '',
//                         pmdcNumber: (p as any).doctor?.pmdcNumber || '',
//                         specializations: Array.isArray((p as any).doctor?.specializations)
//                             ? (p as any).doctor.specializations.join(', ')
//                             : (p as any).doctor?.specializations || ''
//                     },
//                     vitals: buildVitalsForPrint(fullReport),          // your existing function
//                     reportSections: buildPrescriptionSections(fullReport),   // <-- added
//                     diagnosis: p.diagnosis ? stripOtherPrefix(p.diagnosis) : "N/A",
//                     hematologicalTests: getHematologicalTests(p),
//                     radiologicalTests: getRadiologicalTests(p),
//                     notes: p.clinicalNotes || "",
//                     medicines: (p.medicines ?? [])
//                         .filter((m: any) => m.medicineName?.trim())
//                         .map((m: any) => ({
//                             name: m.medicineName,
//                             dosage: m.dosage || "",
//                             duration: m.duration || "",
//                             schedule: `${m.morning ? 1 : 0}-${m.afternoon ? 1 : 0}-${m.night ? 1 : 0}`,
//                             meal: m.beforeMeal ? "Before Meal" : m.afterMeal ? "After Meal" : "",
//                         })),
//                 };

//                 (window as any).AndroidNative.printThermal(JSON.stringify(printPayload));
//             } catch (err) {
//                 console.error("[Print] Mapping error:", err);
//                 alert("Failed to prepare prescription for printing.");
//             } finally {
//                 setIsPrinting(false);          // <-- match VitalReportModal exactly
//                 setIsPrinterModalOpen(false);  //close the BT modal the same way
//             }
//         }, 150);
//     }, [selectedPrescription, fullReport]);

//     // ── Save as PDF ──────────────────────────────────────────────────────────
//     const handleSaveAsPdf = async () => {
//         setShowActionDropdown(false);
//         const el = document.getElementById('prescription-paper-modal');
//         const p = selectedPrescription;
//         if (!el || !p) return;

//         setIsSavingPdf(true);
//         try {
//             const { default: jsPDF } = await import('jspdf');
//             const THERMAL_WIDTH_MM = 80;
//             const THERMAL_WIDTH_PT = THERMAL_WIDTH_MM * 72 / 25.4;

//             const iframe = document.createElement('iframe');
//             iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:auto;height:auto;border:none;';
//             document.body.appendChild(iframe);

//             const iframeDoc = iframe.contentDocument!;
//             iframeDoc.open();
//             iframeDoc.write(`
//       <html>
//         <head>
//           <style>
//             * { margin:0; padding:0; box-sizing:border-box; font-family:monospace; }
//             body { background:#fff; color:#111; padding:16px; display:inline-block; width:auto; }
//             img { display:block; margin:0 auto 4px; height:48px; }
//           </style>
//         </head>
//         <body>${el.innerHTML}</body>
//       </html>
//     `);
//             iframeDoc.close();

//             await new Promise((r) => setTimeout(r, 300));

//             const body = iframeDoc.body;
//             const contentWidth = body.scrollWidth;
//             const contentHeight = body.scrollHeight;

//             const { default: html2canvas } = await import('html2canvas');
//             const canvas = await html2canvas(body, {
//                 scale: 2,
//                 useCORS: true,
//                 backgroundColor: '#ffffff',
//                 width: contentWidth,
//                 height: contentHeight,
//                 windowWidth: contentWidth,
//                 windowHeight: contentHeight,
//             });

//             document.body.removeChild(iframe);

//             const imgData = canvas.toDataURL('image/png');
//             const imgWidthPt = canvas.width / 2;
//             const imgHeightPt = canvas.height / 2;
//             const scaleFactor = THERMAL_WIDTH_PT / imgWidthPt;
//             const pdfWidth = THERMAL_WIDTH_PT;
//             const pdfHeight = imgHeightPt * scaleFactor;

//             const pdf = new jsPDF({ unit: 'pt', format: [pdfWidth, pdfHeight] });
//             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

//             const firstName = p.patient.firstName?.trim() || 'Patient';
//             const lastName = p.patient.lastName?.trim() || '';
//             const fileName = `${firstName}_${lastName}_Rx.pdf`;

//             downloadPDF(pdf, fileName);
//         } catch (err) {
//             console.error('PDF save error:', err);
//             alert('Failed to save PDF');
//         } finally {
//             setIsSavingPdf(false);
//         }
//     };

//     // ── Generate PDF blob (for email) ──────────────────────────────────────
//     // ── Fetch a remotely-hosted PDF (e.g. Cloudinary ECG report) as a Blob ──
//     const fetchEcgPdfBlob = async (url: string): Promise<Blob | null> => {
//         try {
//             const res = await fetch(url);
//             if (!res.ok) throw new Error('Failed to fetch ECG PDF');
//             return await res.blob();
//         } catch (err) {
//             console.error('ECG PDF fetch error:', err);
//             return null;
//         }
//     };

//     // ── Generate PDF blob (for email) ──────────────────────────────────────
//     const generatePdfBlob = async (): Promise<Blob | null> => {
//         const el = document.getElementById('prescription-paper-modal');
//         if (!el) return null;
//         try {
//             const { default: jsPDF } = await import('jspdf');
//             const iframe = document.createElement('iframe');
//             iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:340px;height:auto;border:none;';
//             document.body.appendChild(iframe);
//             const iframeDoc = iframe.contentDocument!;
//             iframeDoc.open();
//             iframeDoc.write(`<html><head><style>
//                 *{margin:0;padding:0;box-sizing:border-box;font-family:monospace}
//                 body{background:#fff;color:#111;width:340px;padding:16px}
//                 img{display:block;margin:0 auto 4px;height:48px}
//             </style></head><body>${el.innerHTML}</body></html>`);
//             iframeDoc.close();
//             await new Promise(r => setTimeout(r, 300));
//             const { default: html2canvas } = await import('html2canvas');
//             const canvas = await html2canvas(iframeDoc.body, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 340 });
//             document.body.removeChild(iframe);
//             const imgData = canvas.toDataURL('image/png');
//             const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
//             pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
//             return pdf.output('blob');
//         } catch (err) {
//             console.error('PDF generation error:', err);
//             return null;
//         }
//     };

//     // ── Email flow ──────────────────────────────────────────────────────────
//     const handleSendEmail = async () => {
//         const p = selectedPrescription;
//         setShowActionDropdown(false);
//         setEmailStatus('checking');
//         setIsEditingEmail(false);
//         setNoEmailInput('');
//         if (!p) return;
//         try {
//             const res = await apiService.getPatientEmail(p.patient_id);
//             if (res.success && res.email) {
//                 setPatientEmail(res.email);
//                 setEditedEmail(res.email);
//                 setEmailStatus('found');
//                 setShowEmailConfirm(true);
//             } else {
//                 setPatientEmail(null);
//                 setEditedEmail('');
//                 setEmailStatus('not_found');
//                 setShowEmailConfirm(true);
//             }
//         } catch {
//             setEmailStatus('error');
//             setTimeout(() => setEmailStatus('idle'), 3000);
//         }
//     };

//     const handleSaveEmail = async (emailToSave: string) => {
//         const p = selectedPrescription;
//         if (!emailToSave.trim() || !p) return;
//         if (!isValidEmail(emailToSave)) {
//             alert('Please enter a valid email address.');
//             return;
//         }
//         setIsSavingEmail(true);
//         try {
//             await apiService.updatePatientEmail(p.patient_id, emailToSave.trim());
//             setPatientEmail(emailToSave.trim());
//             setEditedEmail(emailToSave.trim());
//             setIsEditingEmail(false);
//             setEmailStatus('found');
//         } catch {
//             alert('Failed to save email');
//         } finally {
//             setIsSavingEmail(false);
//         }
//     };

//     const handleConfirmSendEmail = async () => {
//         const p = selectedPrescription;
//         const emailToUse = isEditingEmail ? editedEmail : patientEmail;
//         if (!emailToUse || !p) return;
//         if (!isValidEmail(emailToUse)) {
//             alert('Please enter a valid email address.');
//             return;
//         }
//         setIsSendingEmail(true);
//         try {
//             const pdfBlob = await generatePdfBlob();
//             if (!pdfBlob) throw new Error('Failed to generate PDF');

//             const firstName = p.patient.firstName?.trim() || 'Patient';
//             const lastName = p.patient.lastName?.trim() || '';
//             const fileName = `${firstName}_${lastName}_Rx.pdf`;

//             const formData = new FormData();
//             formData.append('pdf', pdfBlob, fileName);
//             formData.append('email', emailToUse);
//             formData.append('patientName', `${firstName} ${lastName}`);
//             formData.append('token', p.token || '');

//             // ── Attach ECG PDF if one was recorded during rapid testing ──
//             const ecgLink = fullReport?.rapidTesting?.ecgLink;
//             if (shouldShow(ecgLink)) {
//                 const ecgBlob = await fetchEcgPdfBlob(ecgLink);
//                 if (ecgBlob) {
//                     formData.append('ecgPdf', ecgBlob, `${firstName}_${lastName}_ECG.pdf`);
//                 }
//             }

//             const res = await apiService.sendVitalReportEmailPdf(p.patient_id, formData);
//             if (res.success) {
//                 setEmailStatus('sent');
//                 setShowEmailConfirm(false);
//                 setTimeout(() => setEmailStatus('idle'), 3000);
//             } else {
//                 setEmailStatus('error');
//                 setTimeout(() => setEmailStatus('idle'), 3000);
//             }
//         } catch {
//             setEmailStatus('error');
//             setTimeout(() => setEmailStatus('idle'), 3000);
//         } finally {
//             setIsSendingEmail(false);
//         }
//     };

//     // ── Dispense ─────────────────────────────────────────────────────────────
//     const handleDispense = async () => {
//         const p = selectedPrescription;
//         if (!p) return;

//         const hardwareOk = AndroidBridge.dispenseMedicine(2, 4, 6);

//         if (!hardwareOk) {
//             setIsDispensing(true);
//             try {
//                 await apiService.endCall(String(p.patient.id), "dispensed");
//             } catch (err) {
//                 console.error("[Dispense] API call failed:", err);
//             } finally {
//                 setIsDispensing(false);
//             }
//         }

//         setShowActionDropdown(false);
//     };

//     console.log(fullReport)
//     const buildVitalsForPrint = (fullReport: any) => {
//         if (!fullReport) return {};
//         const v = fullReport.vitals || {};
//         const out: Record<string, string> = {};

//         if (shouldShow(v.Systolic) && shouldShow(v.Diastolic)) out['BP'] = `${v.Systolic}/${v.Diastolic} mmHg`;
//         if (shouldShow(v.BloodOxygen)) out['SpO2'] = `${v.BloodOxygen}%`;
//         if (shouldShow(v.PulseRate)) out['Pulse'] = `${v.PulseRate} bpm`;
//         if (shouldShow(v.Temperature)) out['Temp'] = formatTemperature(v.Temperature, v.temperatureUnit);
//         if (shouldShow(v.Weight)) out['Weight'] = `${v.Weight} kg`;
//         if (shouldShow(v.Height)) out['Height'] = formatHeight(v.Height, v.heightUnit);
//         if (shouldShow(v.bmi)) out['BMI'] = v.bmi;

//         const rt = fullReport.rapidTesting;
//         if (rt) {
//             rapidFields.forEach(f => {
//                 if (shouldShow(rt[f.key])) {
//                     out[f.label] = `${shortenResult(rt[f.key])}${f.unit ? ' ' + f.unit : ''}`;
//                 }
//                 // ── Explicitly add blood sugar if present ──
//                 if (shouldShow(rt.bloodSugar)) {
//                     out['Blood Sugar'] = `${rt.bloodSugar} mg/dL`;
//                 }
//             });
//         }

//         const et = fullReport.eyeTesting;
//         if (et?.leftEyeResult) out['Left Eye'] = shortenResult(et.leftEyeResult);
//         if (et?.rightEyeResult) out['Right Eye'] = shortenResult(et.rightEyeResult);

//         const ht = fullReport.hearingTesting;
//         if (ht?.leftEarResult) out['Left Ear'] = shortenResult(ht.leftEarResult);
//         if (ht?.rightEarResult) out['Right Ear'] = shortenResult(ht.rightEarResult);

//         const cb = fullReport.colorBlindTesting;
//         if (cb?.colorBlindResult) out['Color Blind'] = shortenResult(cb.colorBlindResult);

//         if (shouldShow(v.symptoms)) {
//             out['Symptoms'] = typeof v.symptoms === 'string' ? v.symptoms : v.symptoms.join(', ');
//         }

//         return out;
//     };

//     // ── Render ──────────────────────────────────────────────────────────────
//     if (!allowed) return null;

//     return (
//         <main className="min-h-dvh bg-slate-50">

//             <Navbar variant="pharmacy" />

//             <div className="max-w-6xl mx-auto px-4 py-8">
//                 <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-hidden overflow-y-auto mb-6">
//                     <div className="px-8 py-4 border-b flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
//                         <h2 className="font-bold text-xl text-slate-800">CURRENT MEDICATION QUEUE</h2>
//                         <div className="flex gap-3 w-full lg:w-auto">
//                             <input
//                                 type="text"
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                                 placeholder="Search by token or name..."
//                                 className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-full lg:w-64 focus:outline-none focus:border-[#0297d6]"
//                             />
//                             <button
//                                 onClick={() => setSearch("")}
//                                 className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600"
//                             >
//                                 Clear
//                             </button>
//                             <button
//                                 onClick={loadQueue}
//                                 disabled={loadingQueue}
//                                 className="px-4 py-2 text-sm rounded-lg bg-[#0297d6] hover:bg-[#0286c2] disabled:opacity-50 text-white font-bold flex items-center gap-2"
//                             >
//                                 {loadingQueue
//                                     ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading</>
//                                     : 'Refresh'}
//                             </button>
//                         </div>
//                     </div>

//                     <table className="w-full">
//                         <thead className="bg-slate-50">
//                             <tr className="text-sm text-slate-500 font-semibold">
//                                 <th className="px-8 py-4 text-left">SR. NO</th>
//                                 <th className="px-8 py-4 text-left">TOKEN NUMBER</th>
//                                 <th className="px-8 py-4 text-left">Name</th>
//                                 <th className="px-8 py-4 text-left">Phone Number</th>
//                                 <th className="px-8 py-4 text-right">Action</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {filteredPrescriptions.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm">
//                                         No patients found{search && ` matching "${search}"`}
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 filteredPrescriptions.map((p, i) => (
//                                     <tr key={p.id} className="hover:bg-slate-50 transition-colors">
//                                         <td className="px-8 py-5 text-slate-600 font-medium">{i + 1}</td>
//                                         <td className="px-8 py-5 font-bold text-[#0297d6]">#{p.token}</td>
//                                         <td className="px-8 py-5 text-slate-700">
//                                             {p.patient.firstName} {p.patient.lastName}
//                                         </td>
//                                         <td className="px-8 py-5 text-slate-700">{p.patient.phoneNumber}</td>
//                                         <td className="px-8 py-5 text-right">
//                                             <button
//                                                 onClick={() => {
//                                                     setSelectedPrescription(p);
//                                                     setIsModalOpen(true);
//                                                 }}
//                                                 className="bg-[#0297d6] hover:bg-[#0288c2] text-white px-6 py-2 rounded-xl text-sm font-bold"
//                                             >
//                                                 VIEW
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {/* ── Prescription Preview Modal ── */}
//             {isModalOpen && selectedPrescription && (
//                 <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
//                     <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
//                         <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
//                             <h3 className="font-black text-slate-800 text-base uppercase tracking-widest">Prescription Preview</h3>
//                             <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
//                                 <X size={20} />
//                             </button>
//                         </div>

//                         <div className="overflow-y-auto overflow-x-hidden flex-1 bg-slate-50 p-4">
//                             {/* ── Prescription paper ── styled exactly like VitalReportModal ── */}
//                             <div
//                                 id="prescription-paper-modal"
//                                 className="bg-white border border-slate-200 rounded-2xl shadow-sm mx-auto"
//                                 style={{ fontFamily: 'monospace', width: 300, padding: 16 }}
//                             >
//                                 {/* Logo & header */}
//                                 <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 10 }}>
//                                     <img src="/logo2.png" alt={app.name} style={{ height: 44, margin: '0 auto 4px' }} />
//                                     <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Prescription</div>
//                                     <div style={{ fontSize: 10, fontWeight: 700 }}>{app.name} Digital Health</div>
//                                 </div>

//                                 {/* Patient info */}
//                                 <div style={{ borderBottom: '1px dashed #bbb', paddingBottom: 8, marginBottom: 4 }}>
//                                     <Row label="Name" value={`${selectedPrescription.patient.firstName} ${selectedPrescription.patient.lastName}`} />
//                                     {/* <Row label="Phone" value={selectedPrescription.patient.phoneNumber || 'N/A'} /> */}
//                                     {selectedPrescription.patient.age && <Row label="Age" value={`${selectedPrescription.patient.age} yrs`} />}
//                                     {selectedPrescription.patient.gender && <Row label="Gender" value={selectedPrescription.patient.gender} />}
//                                     <Row label="Token" value={`#${selectedPrescription.token}`} />
//                                     <Row
//                                         label="Date"
//                                         value={
//                                             selectedPrescription.prescriptionDate
//                                                 ? new Date(selectedPrescription.prescriptionDate).toLocaleDateString()
//                                                 : '—'
//                                         }
//                                     />
//                                     {selectedPrescription.prescriptionTime && (
//                                         <Row label="Time" value={String(selectedPrescription.prescriptionTime).slice(0, 5)} />
//                                     )}
//                                     {(selectedPrescription as any).updatedAt && (
//                                         <Row label="Updated" value={formatUpdatedAt((selectedPrescription as any).updatedAt)} />
//                                     )}
//                                 </div>

//                                 {/* ── Prescribing Doctor ── */}
//                                 {(selectedPrescription as any).doctor && (
//                                     <div style={{ borderBottom: '1px dashed #bbb', paddingBottom: 8, marginBottom: 4, marginTop: 4 }}>
//                                         <Row
//                                             label="Doctor"
//                                             value={`${(selectedPrescription as any).doctor.title || ''} ${(selectedPrescription as any).doctor.firstName || ''} ${(selectedPrescription as any).doctor.lastName || ''}`.trim()}
//                                         />
//                                         {(selectedPrescription as any).doctor.pmdcNumber && (
//                                             <Row label="PMDC #" value={(selectedPrescription as any).doctor.pmdcNumber} />
//                                         )}
//                                         {Array.isArray((selectedPrescription as any).doctor.qualifications) &&
//                                             (selectedPrescription as any).doctor.qualifications.length > 0 && (
//                                                 <Row
//                                                     label="Qualification"
//                                                     value={(selectedPrescription as any).doctor.qualifications.join(', ')}
//                                                 />
//                                             )}
//                                         {Array.isArray((selectedPrescription as any).doctor.specializations) &&
//                                             (selectedPrescription as any).doctor.specializations.length > 0 && (
//                                                 <Row label="Specialization" value={(selectedPrescription as any).doctor.specializations.join(', ')} />
//                                             )}
//                                     </div>
//                                 )}

//                                 {/* ── All screening data from fullReport ── */}
//                                 {loadingReport ? (
//                                     <div style={{ textAlign: 'center', padding: '8px 0' }}>
//                                         <Loader2 size={16} className="animate-spin inline-block" /> Loading report...
//                                     </div>
//                                 ) : fullReport ? (
//                                     <>
//                                         {/* ── VITALS ── */}
//                                         {(() => {
//                                             const v = fullReport.vitals;
//                                             const hasVitals = shouldShow(v.Systolic) || shouldShow(v.Diastolic) ||
//                                                 shouldShow(v.BloodOxygen) || shouldShow(v.PulseRate) ||
//                                                 shouldShow(v.Temperature) || shouldShow(v.Weight) ||
//                                                 shouldShow(v.Height) || shouldShow(v.bmi);
//                                             if (!hasVitals) return null;
//                                             return (
//                                                 <>
//                                                     <SectionTitle title="Vitals" />
//                                                     {shouldShow(v.Systolic) && shouldShow(v.Diastolic) && (
//                                                         <Row label="Blood Pressure" value={`${v.Systolic}/${v.Diastolic} mmHg`} />
//                                                     )}
//                                                     {shouldShow(v.BloodOxygen) && <Row label="SpO2" value={`${v.BloodOxygen}%`} />}
//                                                     {shouldShow(v.PulseRate) && <Row label="Pulse Rate" value={`${v.PulseRate} bpm`} />}
//                                                     {shouldShow(v.Temperature) && (
//                                                         <Row label="Temperature" value={formatTemperature(v.Temperature, v.temperatureUnit)} />
//                                                     )}
//                                                     {shouldShow(v.Weight) && <Row label="Weight" value={`${v.Weight} kg`} />}
//                                                     {shouldShow(v.Height) && (
//                                                         <Row label="Height" value={formatHeight(v.Height, v.heightUnit)} />
//                                                     )}
//                                                     {shouldShow(v.bmi) && <Row label="BMI" value={v.bmi} />}
//                                                 </>
//                                             );
//                                         })()}

//                                         {/* ── RAPID TESTING ── */}
//                                         {(() => {
//                                             const rt = fullReport.rapidTesting;
//                                             if (!rt) return null;
//                                             const hasRapid = rapidFields.some(f => shouldShow(rt[f.key]));
//                                             if (!hasRapid) return null;
//                                             return (
//                                                 <>
//                                                     <SectionTitle title="Rapid Testing" />
//                                                     {rapidFields.map(f => {
//                                                         if (!shouldShow(rt[f.key])) return null;
//                                                         const val = shortenResult(rt[f.key]);
//                                                         const unit = f.unit ? ` ${f.unit}` : '';
//                                                         return <Row key={f.key} label={f.label} value={`${val}${unit}`} />;
//                                                     })}
//                                                 </>
//                                             );
//                                         })()}

//                                         {/* ── EYE TESTING ── */}
//                                         {(() => {
//                                             const et = fullReport.eyeTesting;
//                                             if (!et) return null;
//                                             const hasEye = shouldShow(et.leftEye) || shouldShow(et.rightEye);
//                                             if (!hasEye) return null;
//                                             return (
//                                                 <>
//                                                     <SectionTitle title="Eye Screening" />
//                                                     {shouldShow(et.chartType) && <Row label="Chart Type" value={et.chartType} />}
//                                                     {shouldShow(et.leftEye) && <Row label="Left Eye" value={shortenResult(et.leftEyeResult)} />}
//                                                     {shouldShow(et.rightEye) && <Row label="Right Eye" value={shortenResult(et.rightEyeResult)} />}
//                                                 </>
//                                             );
//                                         })()}

//                                         {/* ── COLOR BLIND TESTING ── */}
//                                         {(() => {
//                                             const cb = fullReport.colorBlindTesting;
//                                             if (!cb) return null;
//                                             if (!shouldShow(cb.colorBlindResult)) return null;
//                                             return (
//                                                 <>
//                                                     <SectionTitle title="Color Blind Screening" />
//                                                     <Row label="Result" value={shortenResult(cb.colorBlindResult)} />
//                                                 </>
//                                             );
//                                         })()}

//                                         {/* ── HEARING TESTING ── */}
//                                         {(() => {
//                                             const ht = fullReport.hearingTesting;
//                                             if (!ht) return null;
//                                             const hasHearing = shouldShow(ht.leftEarResult) || shouldShow(ht.rightEarResult);
//                                             if (!hasHearing) return null;
//                                             return (
//                                                 <>
//                                                     <SectionTitle title="Hearing Screening" />
//                                                     {shouldShow(ht.leftEarResult) && <Row label="Left Ear" value={shortenResult(ht.leftEarResult)} />}
//                                                     {shouldShow(ht.rightEarResult) && <Row label="Right Ear" value={shortenResult(ht.rightEarResult)} />}
//                                                 </>
//                                             );
//                                         })()}

//                                         {/* ── SYMPTOMS ── */}
//                                         {(() => {
//                                             const sym = fullReport.vitals?.symptoms;
//                                             if (!shouldShow(sym)) return null;
//                                             return (
//                                                 <>
//                                                     <SectionTitle title="Symptoms" />
//                                                     <div style={{ fontSize: 11, color: '#333', lineHeight: 1.6 }}>
//                                                         {typeof sym === 'string' ? sym : sym.join(', ')}
//                                                     </div>
//                                                 </>
//                                             );
//                                         })()}
//                                     </>
//                                 ) : null}

//                                 {/* ── Diagnosis (from prescription) ── */}
//                                 {selectedPrescription.diagnosis && (
//                                     <>
//                                         <SectionTitle title="Diagnosis" />
//                                         <div style={{ fontSize: 11, color: '#333', marginBottom: 6 }}>
//                                             {stripOtherPrefix(selectedPrescription.diagnosis)}
//                                         </div>
//                                     </>
//                                 )}

//                                 {/* ── Medicines ── */}
//                                 {(() => {
//                                     const meds = (selectedPrescription.medicines ?? []).filter((m: any) => m.medicineName);
//                                     if (meds.length === 0) return null;
//                                     return (
//                                         <>
//                                             <SectionTitle title="Prescribed Medicines" />
//                                             {meds.map((m: any, idx: number) => (
//                                                 <div key={m.id || idx} style={{ marginBottom: 4, borderBottom: '1px solid #f0f0f0', paddingBottom: 4 }}>
//                                                     <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
//                                                         {idx + 1}. {m.medicineName}
//                                                     </div>
//                                                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555' }}>
//                                                         <span>{m.dosage || '—'} · {m.duration || '—'}</span>
//                                                         <span style={{ fontWeight: 700, color: '#111' }}>
//                                                             {formatSchedule(m)}
//                                                         </span>
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                         </>
//                                     );
//                                 })()}

//                                 {/* ── Hematological Tests ── */}
//                                 {getHematologicalTests(selectedPrescription).length > 0 && (
//                                     <>
//                                         <SectionTitle title="Hematological Tests" />
//                                         <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                                             {getHematologicalTests(selectedPrescription).map((test: string, idx: number) => (
//                                                 <li key={idx} style={{ fontSize: 11, color: '#333', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
//                                                     <span style={{ color: '#0297d6', fontWeight: 900 }}>›</span>
//                                                     <span>{test}</span>
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     </>
//                                 )}

//                                 {/* ── Radiological Tests ── */}
//                                 {getRadiologicalTests(selectedPrescription).length > 0 && (
//                                     <>
//                                         <SectionTitle title="Radiological Tests" />
//                                         <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                                             {getRadiologicalTests(selectedPrescription).map((test: string, idx: number) => (
//                                                 <li key={idx} style={{ fontSize: 11, color: '#333', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
//                                                     <span style={{ color: '#0297d6', fontWeight: 900 }}>›</span>
//                                                     <span>{test}</span>
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     </>
//                                 )}
//                                 {/* ── Clinical Notes ── */}
//                                 {selectedPrescription.clinicalNotes && (
//                                     <>
//                                         <SectionTitle title="Clinical Notes" />
//                                         <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5, fontStyle: 'italic' }}>
//                                             {selectedPrescription.clinicalNotes}
//                                         </div>
//                                     </>
//                                 )}

//                                 {/* Footer */}
//                                 <div style={{ marginTop: 16, textAlign: 'center', fontSize: 8, letterSpacing: 2, opacity: 1 }}>
//                                     This Digital Report from {app.name} does not require stamp or signature
//                                     and is not valid for Legal proceedings.
//                                 </div>
//                             </div>

//                             {/* ── Email confirm dialog ── (unchanged) ── */}
//                             {showEmailConfirm && (
//                                 <div className="mt-4 px-5 py-4 rounded-2xl border border-slate-100 bg-blue-50 space-y-3">
//                                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
//                                         {emailStatus === 'not_found' ? 'No email on file — add one:' : 'Send report to:'}
//                                     </p>
//                                     {emailStatus === 'found' && !isEditingEmail && (
//                                         <div className="flex items-center gap-2">
//                                             <span className="flex-1 text-sm font-black text-[#0297d6] truncate">{patientEmail}</span>
//                                             <button
//                                                 onClick={() => { setIsEditingEmail(true); setEditedEmail(patientEmail || '') }}
//                                                 className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
//                                             >
//                                                 ✏️
//                                             </button>
//                                         </div>
//                                     )}
//                                     {emailStatus === 'found' && isEditingEmail && (
//                                         <div className="flex gap-2">
//                                             <input
//                                                 type="email"
//                                                 value={editedEmail}
//                                                 onChange={e => setEditedEmail(e.target.value)}
//                                                 className="flex-1 px-3 py-2 text-xs border-2 border-[#0297d6] rounded-xl outline-none font-bold"
//                                                 placeholder="Enter new email"
//                                                 autoFocus
//                                             />
//                                             <button
//                                                 onClick={() => handleSaveEmail(editedEmail)}
//                                                 disabled={isSavingEmail || !editedEmail.trim()}
//                                                 className="px-3 py-2 bg-[#0297d6] text-white text-xs font-bold rounded-xl disabled:opacity-50"
//                                             >
//                                                 {isSavingEmail ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
//                                             </button>
//                                             <button
//                                                 onClick={() => setIsEditingEmail(false)}
//                                                 className="px-3 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl"
//                                             >
//                                                 ✕
//                                             </button>
//                                         </div>
//                                     )}
//                                     {emailStatus === 'not_found' && (
//                                         <div className="flex gap-2">
//                                             <input
//                                                 type="email"
//                                                 value={noEmailInput}
//                                                 onChange={e => setNoEmailInput(e.target.value)}
//                                                 className="flex-1 px-3 py-2 text-xs border-2 border-[#0297d6] rounded-xl outline-none font-bold"
//                                                 placeholder="patient@email.com"
//                                                 autoFocus
//                                             />
//                                             <button
//                                                 onClick={() => handleSaveEmail(noEmailInput)}
//                                                 disabled={isSavingEmail || !noEmailInput.trim()}
//                                                 className="px-3 py-2 bg-[#0297d6] text-white text-xs font-bold rounded-xl disabled:opacity-50"
//                                             >
//                                                 {isSavingEmail ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
//                                             </button>
//                                         </div>
//                                     )}
//                                     <div className="flex gap-2 pt-1">
//                                         <button
//                                             onClick={() => { setShowEmailConfirm(false); setEmailStatus('idle'); setIsEditingEmail(false) }}
//                                             className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
//                                         >
//                                             Cancel
//                                         </button>
//                                         <button
//                                             onClick={handleConfirmSendEmail}
//                                             disabled={isSendingEmail || emailStatus === 'not_found' || isEditingEmail}
//                                             className="flex-1 py-2.5 rounded-xl bg-[#0297d6] text-white text-xs font-bold hover:bg-[#0286c2] flex items-center justify-center gap-1 disabled:opacity-50"
//                                         >
//                                             {isSendingEmail ? <><Loader2 size={12} className="animate-spin" />Sending...</> : <><Mail size={12} />Send PDF</>}
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* WhatsApp confirm dialog */}
//                             {showWhatsappConfirm && (
//                                 <div className="absolute left-4 right-4 bottom-4 z-50 px-5 py-4 rounded-2xl border border-slate-100 bg-green-50 shadow-2xl space-y-3 overflow-x-hidden">
//                                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Send report on WhatsApp to:</p>
//                                     <div className="flex gap-2 min-w-0">
//                                         <CountryCodeSelect
//                                             value={waCountry}
//                                             options={COUNTRY_DIAL_CODES}
//                                             onChange={(c) => { setWaCountry(c); setWaError(null) }}
//                                         />
//                                         <input
//                                             type="tel"
//                                             value={waLocalNumber}
//                                             onChange={e => { setWaLocalNumber(e.target.value); setWaError(null) }}
//                                             className="flex-1 min-w-0 px-3 py-2 text-xs border-2 border-[#25D366] rounded-xl outline-none font-bold"
//                                             placeholder="3001234567"
//                                             autoFocus
//                                         />
//                                     </div>
//                                     {waError && <p className="text-[11px] font-bold text-red-500">{waError}</p>}
//                                     <div className="flex gap-2 pt-1">
//                                         <button
//                                             onClick={() => { setShowWhatsappConfirm(false); setWaError(null) }}
//                                             className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
//                                         >
//                                             Cancel
//                                         </button>
//                                         <button
//                                             onClick={handleConfirmSendWhatsapp}
//                                             className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1ebe5a] flex items-center justify-center gap-1"
//                                         >
//                                             <MessageCircle size={12} />Open WhatsApp
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}

//                             {emailStatus === 'sent' && (
//                                 <div className="mt-2 py-2 px-3 bg-green-100 text-green-700 rounded-xl text-xs font-bold text-center">
//                                     ✓ Report sent successfully!
//                                 </div>
//                             )}
//                             {emailStatus === 'error' && (
//                                 <div className="mt-2 py-2 px-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold text-center">
//                                     Failed to send email. Try again.
//                                 </div>
//                             )}
//                             {whatsappStatus === 'error' && (
//                                 <div className="mt-2 py-2 px-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold text-center">
//                                     Failed to prepare WhatsApp message. Try again.
//                                 </div>
//                             )}
//                         </div>

//                         {/* ── Footer actions ── (unchanged) ── */}
//                         <div className="px-5 py-4 border-t border-slate-100 flex gap-2 relative">
//                             <button
//                                 onClick={handlePrint}
//                                 disabled={isPrinting}
//                                 className={`flex-1 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${isPrinting ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-slate-900 hover:bg-[#0297d6] text-white active:scale-95'
//                                     }`}
//                             >
//                                 {isPrinting ? <><Loader2 size={15} className="animate-spin" />Processing...</> : <><Printer size={15} />Print</>}
//                             </button>

//                             <div className="relative">
//                                 <button
//                                     onClick={() => setShowActionDropdown(p => !p)}
//                                     className="h-full px-4 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-1 transition-all bg-slate-900 hover:bg-[#0297d6] text-white active:scale-95"
//                                 >
//                                     Action <ChevronDown size={13} />
//                                 </button>

//                                 {showActionDropdown && (
//                                     <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10">
//                                         <button
//                                             onClick={handleSendEmail}
//                                             disabled={emailStatus === 'checking'}
//                                             className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
//                                         >
//                                             {emailStatus === 'checking'
//                                                 ? <><Loader2 size={13} className="animate-spin" />Checking...</>
//                                                 : <><Mail size={13} className="text-[#0297d6]" />Send via Email</>
//                                             }
//                                         </button>
//                                         <div className="border-t border-slate-100" />
//                                         <button
//                                             onClick={handleOpenWhatsapp}
//                                             className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
//                                         >
//                                             <MessageCircle size={13} className="text-[#25D366]" />Send via WhatsApp
//                                         </button>
//                                         <div className="border-t border-slate-100" />
//                                         <button
//                                             onClick={handleSaveAsPdf}
//                                             disabled={isSavingPdf}
//                                             className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
//                                         >
//                                             {isSavingPdf
//                                                 ? <><Loader2 size={13} className="animate-spin" />Saving...</>
//                                                 : <><FileDown size={13} className="text-[#0297d6]" />Save as PDF</>
//                                             }
//                                         </button>
//                                         <div className="border-t border-slate-100" />
//                                         <button
//                                             onClick={handleDispense}
//                                             disabled={isDispensing}
//                                             className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
//                                         >
//                                             {isDispensing
//                                                 ? <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" />Dispensing...</span>
//                                                 : 'Dispense'
//                                             }
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )
//             }

//             <style>{`
//                 @media print {
//                     body * { visibility: hidden; }
//                     #prescription-paper-modal, #prescription-paper-modal * { visibility: visible; }
//                     #prescription-paper-modal {
//                         position: absolute; left: 50%; top: 0;
//                         transform: translateX(-50%);
//                         width: 300px !important; padding: 16px !important;
//                         box-shadow: none !important; border: none !important;
//                     }
//                     .print\\:hidden { display: none !important; }
//                 }
//             `}</style>

//             <BluetoothPrinterModal
//                 isOpen={isPrinterModalOpen}
//                 onClose={() => { if (!isPrinting) setIsPrinterModalOpen(false); }}
//                 onPrint={executePrint}
//                 isPrinting={isPrinting}
//             />
//         </main >
//     );
// };

// export default Page;