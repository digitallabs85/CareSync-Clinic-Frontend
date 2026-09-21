'use client'
import React, { useEffect, useState, useMemo } from 'react'
import VitalCard from './_components/VitalCard'
import { VitalType } from '@/app/_utils/types'
import { Button } from '@/components/ui/button'
import { apiService } from '@/app/_utils/apiService'
import { Input } from '@/components/ui/input'
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, Loader2 } from 'lucide-react'
import Navbar from '../_components/Navbar'
import TokenDialog from './_components/TokenDialog';
import VitalReportModal from './_components/VitalReportModal'
import { downloadPDF } from '@/app/_utils/pdfExport';
import { usePageGuard } from '@/app/_utils/usePageGuard'

const emptyVitals = {
  BP: { value1: '', value2: '' },
  PulseRate: "",
  Temperature: '',
  Spo2: '',
  Height: "",
  Weight: "",
};

const VitalsPage = () => {
  const [vitals, setVitals] = useState(emptyVitals);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [tokenNumber, setTokenNumber] = useState("");
  const [sessionPhone, setSessionPhone] = useState("");
  const [sessionDob, setSessionDob] = useState("");
  const [historySearchPhone, setHistorySearchPhone] = useState("");
  const [openTokenDialog, setOpenTokenDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [sessionAge, setSessionAge] = useState();
  const [sessionGender, setSessionGender] = useState();
  const [showExpiredToast, setShowExpiredToast] = useState(false);
  const [showInvalidToast, setShowInvalidToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [searchMode, setSearchMode] = useState<'token' | 'phone'>('token');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [vitalsId, setVitalsId] = useState<string>("")
  const [step, setStep] = useState<1 | 2>(1);
  const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('ft');
  const [tempUnit, setTempUnit] = useState<'°C' | '°F'>('°F');
  const [showNoSessionToast, setShowNoSessionToast] = useState(false);
  const [showVitalReport, setShowVitalReport] = useState(false)
  const allowed = usePageGuard('vitals');
  const [userTouched, setUserTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setUserTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  useEffect(() => {
    const savedSession = localStorage.getItem('localClinic_session');
    if (savedSession) {
      try {
        const s = JSON.parse(savedSession);
        if (s.sessionPhone) {
          setSessionPhone(s.sessionPhone);
          setSessionName(s.sessionName || '');
          setSessionAge(s.sessionAge || "");
          setSessionDob(s.sessionDob || "");
          setSessionGender(s.sessionGender);
          setTokenNumber(s.tokenNumber || '');
          setSessionToken(s.sessionToken || '');
          setVitalsId(s.vitalsId || '');
          setStep(s.step || 1);
          setHeightUnit(s.heightUnit || 'ft');
          setTempUnit(s.tempUnit || '°C');
          if (s.vitals) setVitals(s.vitals);
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!sessionPhone) return;
    localStorage.setItem('localClinic_session', JSON.stringify({
      sessionPhone, sessionName, sessionAge, sessionGender, sessionDob,
      tokenNumber, sessionToken, vitalsId, step, heightUnit, tempUnit, vitals,
    }));
  }, [sessionPhone, sessionName, sessionDob, sessionAge, sessionGender,
    tokenNumber, sessionToken, vitalsId, step, heightUnit, tempUnit, vitals]);

  useEffect(() => {
    const raw = sessionStorage.getItem('vitalsHandoff');
    if (!raw) return;
    sessionStorage.removeItem('vitalsHandoff'); // one-time — consume immediately

    let handoff: { patientId: string; token: string };
    try {
      handoff = JSON.parse(raw);
    } catch {
      return;
    }
    if (!handoff.patientId || !handoff.token) return;

    const startSessionFromHandoff = async () => {
      setAutoVerifying(true);
      try {
        const res = await apiService.verifyToken(handoff.token);
        if (res?.id) {
          resetSessionState();
          localStorage.setItem("localClinic_entryId", res.id);
          setSessionPhone(res.phoneNumber);
          setSessionName(`${res.firstName || ""} ${res.lastName || ""}`.trim());
          setSessionToken(handoff.token);
          setSessionDob(res.dob);
          setSessionGender(res.gender);
          setSessionAge(res.age);
          setTokenNumber(handoff.token);

          // pull most recent vitals across all visits for this phone number,
          // since each visit/day/clinic creates a separate patients row
          const history = await apiService.getVitalsHistoryByPhone(res.phoneNumber);
          const list = Array.isArray(history) ? history : history?.vitals || [];
          const latest = list[0]; // already sorted newest-first by getVitalsByPhone's orderBy
          if (latest) {
            setVitals({
              BP: { value1: String(latest.systolic ?? ''), value2: String(latest.diastolic ?? '') },
              PulseRate: String(latest.pulseRate ?? ''),
              Temperature: String(latest.temperature ?? ''),
              Spo2: String(latest.bloodOxygen ?? ''),
              Height: String(latest.height ?? ''),
              Weight: String(latest.weight ?? ''),
            });
            if (latest.heightUnit) setHeightUnit(latest.heightUnit);
            if (latest.temperatureUnit) setTempUnit(latest.temperatureUnit);
          }
        }
      } catch (err) {
        console.error('Failed to start session from handoff', err);
      } finally {
        setAutoVerifying(false);
      }
    };

    startSessionFromHandoff();
  }, []);

  const resetSessionState = () => {
    setHistory([]);
    setHistorySearchPhone("");
    setVitals(emptyVitals);
    setHeightUnit('ft');
    setTempUnit('°C');
    setStep(1);
    setVitalsId('');
    setUserTouched({});
    localStorage.removeItem('localClinic_session');
  };

  const handleUpdate = (type: keyof typeof vitals, val: string) => {
    setVitals(prev => ({ ...prev, [type]: val }));
  };

  const handleBPUpdate = (field: 'value1' | 'value2', val: string) => {
    setVitals(prev => ({ ...prev, BP: { ...prev.BP, [field]: val } }));
  };

  const handleTemperatureChange = (val: string) => {
    if (tempUnit === '°C') {
      let cleaned = val.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      const integerPart = parts[0].slice(0, 3);
      const decimalPart = parts[1] ? parts[1].slice(0, 1) : '';
      handleUpdate('Temperature', decimalPart ? `${integerPart}.${decimalPart}` : integerPart);
    } else {
      let cleaned = val.replace(/[^0-9-]/g, '');
      cleaned = cleaned.includes('-') ? '-' + cleaned.replace(/-/g, '') : cleaned.replace(/-/g, '');
      const match = cleaned.match(/^-?\d{1,3}/);
      handleUpdate('Temperature', match ? match[0] : '');
    }
  };

  const toggleTempUnit = () => {
    setTempUnit(prev => {
      const numeric = parseFloat(vitals.Temperature);
      if (isNaN(numeric)) return prev === '°C' ? '°F' : '°C';
      if (prev === '°C') {
        handleUpdate('Temperature', Math.round(numeric * 9 / 5 + 32).toString());
        return '°F';
      }
      handleUpdate('Temperature', ((numeric - 32) * 5 / 9).toFixed(1));
      return '°C';
    });
  };

  const feetDotInchesToInches = (val: string) => {
    const [f, i] = val.split('.');
    return (parseInt(f) || 0) * 12 + (parseInt(i) || 0);
  };

  const inchesToFeetDot = (totalInches: number) => {
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    return `${ft}.${inch}`;
  };
  const feetDotToCm = (val: string) => (feetDotInchesToInches(val) * 2.54).toFixed(1);
  const cmToFeetDot = (val: string) => inchesToFeetDot(parseFloat(val) / 2.54);

  const toggleHeightUnit = () => {
    setHeightUnit(prev => {
      if (prev === 'ft') {
        handleUpdate('Height', feetDotToCm(vitals.Height || '0.0'));
        return 'cm';
      }
      handleUpdate('Height', cmToFeetDot(vitals.Height || '0'));
      return 'ft';
    });
  };

  const bmi = useMemo(() => {
    const weight = parseFloat(vitals.Weight);
    if (!weight || !vitals.Height) return null;
    let heightMeters: number;
    if (heightUnit === 'cm') {
      const cm = parseFloat(vitals.Height);
      if (!cm) return null;
      heightMeters = cm / 100;
    } else {
      const feet = parseFloat(vitals.Height?.split('.')[0] || '0');
      const inches = parseFloat(vitals.Height?.split('.')[1] || '0');
      heightMeters = ((feet * 12) + inches) * 0.0254;
    }
    if (!heightMeters) return null;
    const value = weight / (heightMeters * heightMeters);
    let label = '';
    if (value < 18.5) label = 'Underweight';
    else if (value < 25) label = 'Healthy';
    else if (value < 30) label = 'Overweight';
    else label = 'Obese';
    return { value: value.toFixed(1), label, color: 'text-purple-500' };
  }, [vitals.Weight, vitals.Height, heightUnit]);

  // ── GET /api/patients/verify-token/:token — returns the raw patient object ──
  const handleVerifyToken = async () => {
    if (!tokenNumber) return;
    setVerifyingToken(true);
    try {
      const res = await apiService.verifyToken(parseInt(tokenNumber).toString());
      if (res && res.id) {
        setOpenTokenDialog(false);
        resetSessionState();
        localStorage.setItem("localClinic_entryId", res.id);
        setSessionPhone(res.phoneNumber);
        setSessionName(`${res.firstName || ""} ${res.lastName || ""}`.trim());
        setSessionToken(tokenNumber);
        setSessionDob(res.dob);
        setSessionGender(res.gender);
        setSessionAge(res.age);
      }
    } catch (error: any) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already used")) {
        setShowExpiredToast(true);
        setTimeout(() => setShowExpiredToast(false), 3000);
      } else {
        setShowInvalidToast(true);
        setTimeout(() => setShowInvalidToast(false), 3000);
      }
      setOpenTokenDialog(true);
    } finally {
      setVerifyingToken(false);
    }
  };

  // ── GET /api/patients/today-token/:phone → then verify-token/:token ──
  const handleVerifyByPhone = async () => {
    if (!phoneSearch) return;
    setVerifyingToken(true);
    try {
      const tokenRes = await apiService.getTodayTokenByPhone(phoneSearch);
      const tokenToUse = tokenRes?.token;
      if (!tokenToUse) {
        setShowInvalidToast(true);
        setTimeout(() => setShowInvalidToast(false), 3000);
        setOpenTokenDialog(true);
        return;
      }

      const res = await apiService.verifyToken(parseInt(tokenToUse).toString());
      if (!res || !res.id) {
        setShowInvalidToast(true);
        setTimeout(() => setShowInvalidToast(false), 3000);
        setOpenTokenDialog(true);
        return;
      }

      setOpenTokenDialog(false);
      resetSessionState();
      localStorage.setItem('localClinic_entryId', res.id);
      setSessionPhone(phoneSearch);
      setSessionName(`${res.firstName || ""} ${res.lastName || ""}`.trim());
      setSessionAge(res.age);
      setSessionGender(res.gender);
      setSessionDob(res.dob);
      setTokenNumber(tokenToUse);
      setSessionToken(tokenToUse);
    } catch (error: any) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already used')) {
        setShowExpiredToast(true);
        setTimeout(() => setShowExpiredToast(false), 3000);
      } else {
        setShowInvalidToast(true);
        setTimeout(() => setShowInvalidToast(false), 3000);
      }
      setOpenTokenDialog(true);
    } finally {
      setVerifyingToken(false);
    }
  };

  // Reused: verify-token throws "already used" once a prescription exists for the token
  const checkTokenHasPrescription = async (token: string): Promise<boolean> => {
    if (!token) return false;
    try {
      await apiService.verifyToken(parseInt(token).toString());
      return false;
    } catch (error: any) {
      return (error.message || "").toLowerCase().includes("already used");
    }
  };

  // ── POST /api/vitals ──
  const handleNextStep = async () => {
    if (!sessionPhone) {
      setOpenTokenDialog(true);
      setShowNoSessionToast(true);
      setTimeout(() => setShowNoSessionToast(false), 3000);
      return;
    }
    const patientId = localStorage.getItem("localClinic_entryId");
    if (!patientId) {
      alert("No active patient session.");
      return;
    }

    setLoading(true);
    try {
      const hasPrescription = await checkTokenHasPrescription(sessionToken || tokenNumber);
      if (hasPrescription) {
        setShowExpiredToast(true);
        setTimeout(() => setShowExpiredToast(false), 3000);
        return;
      }

      const vitalsToSave = {
        ...vitals,
        heightUnit,
        temperatureUnit: tempUnit,
        bmi: bmi?.value,
        patientType: 'walk-in',
      };

      const result = await apiService.saveVitals(patientId, vitalsToSave);
      const savedId = result?.id;
      if (!savedId) {
        alert("Failed to capture vitals ID. Please try again.");
        return;
      }
      setVitalsId(savedId);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setStep(2);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── GET /api/vitals/history-by-phone/:phone ──
  const handleSearchHistory = async (): Promise<void> => {
    if (!historySearchPhone) {
      alert("Please enter a phone number");
      return;
    }
    setFetching(true);
    try {
      const res = await apiService.getVitalsHistoryByPhone(historySearchPhone);
      const list = Array.isArray(res) ? res : res?.vitals || [];
      setHistory(list);
      if (list.length === 0) alert("No records found.");
    } catch (error: any) {
      alert(error.message || "Failed to fetch history");
      setHistory([]);
    } finally {
      setFetching(false);
    }
  };

  const exportToExcel = () => {
    if (!history.length) return;
    const infoRows = [{ "Patient Name": sessionName, "Phone Number": historySearchPhone }, {}];
    const dataRows = history.map((rec: any) => ({
      "Date": rec.createdAt,
      "Blood Pressure": `${rec.systolic}/${rec.diastolic} mmHg`,
      "Pulse (bpm)": `${rec.pulseRate} bpm`,
      "Blood Oxygen (%)": `${rec.bloodOxygen} %`,
      "Weight (kg)": `${rec.weight} kg`,
      "Height (cm)": `${rec.height} cm`,
      "Temperature": `${rec.temperature} ${rec.temperatureUnit || ''}`,
    }));
    const ws = XLSX.utils.json_to_sheet([...infoRows, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VitalsHistory");
    XLSX.writeFile(wb, `History_${historySearchPhone}.xlsx`);
  };

  const exportToPDF = () => {
    if (!history.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Vitals Report", 14, 14);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${sessionName}`, 14, 24);
    doc.text(`Phone: ${historySearchPhone}`, 14, 31);
    const tableData = history.map((rec: any) => [
      rec.createdAt,
      `${rec.systolic}/${rec.diastolic}`,
      rec.pulseRate, rec.bloodOxygen, rec.weight, rec.height, rec.temperature,
    ]);
    autoTable(doc, {
      head: [["Date", "BP (mmHg)", "Pulse", "SpO2 (%)", "Weight (kg)", "Height (cm)", "Temp"]],
      body: tableData,
      startY: 38,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [2, 151, 214] },
    });
    downloadPDF(doc, `History_${historySearchPhone}.pdf`);
  };

  return (
    <div className="min-h-screen bg-skeuo-base">
      {/* ---------------- Full-screen loader ---------------- */}
      {autoVerifying && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-skeuo-red border-t-transparent" />
          <p className="text-base font-semibold text-skeuo-muted">Starting patient session…</p>
        </div>
      )}

      <VitalReportModal
        isOpen={showVitalReport}
        onClose={() => setShowVitalReport(false)}
        vitalsId={vitalsId}
        patientId={localStorage.getItem("localClinic_entryId") || ""}
        patientName={sessionName}
      />

      {/* ---------------- Toast stack ---------------- */}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        <div className={`transition-all duration-300 ${showSuccessToast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}>
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-600/25">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Vitals saved successfully!
          </div>
        </div>

        <div className={`transition-all duration-300 ${showExpiredToast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}>
          <div className="flex items-center gap-3 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-rose-600/25">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </span>
            Token #{tokenNumber} has already been used today.
          </div>
        </div>

        <div className={`transition-all duration-300 ${showInvalidToast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}>
          <div className="flex items-center gap-3 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-600/25">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </span>
            Token #{tokenNumber} is invalid or not generated for today.
          </div>
        </div>

        <div className={`transition-all duration-300 ${showNoSessionToast ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}>
          <div className="flex items-center gap-3 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-amber-500/25">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </span>
            Please enter a token to start recording vitals.
          </div>
        </div>
      </div>

      <Navbar variant="vitals" onAddToken={() => setOpenTokenDialog(true)} />

      <div className="relative">
        {openTokenDialog && (
          <TokenDialog
            isOpen={openTokenDialog}
            tokenNumber={tokenNumber}
            onClose={() => setOpenTokenDialog(false)}
            setTokenNumber={setTokenNumber}
            onVerify={handleVerifyToken}
            isVerifying={verifyingToken}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            phoneSearch={phoneSearch}
            setPhoneSearch={setPhoneSearch}
            onVerifyByPhone={handleVerifyByPhone}
          />
        )}

        <section className={`transition-all duration-300 ${openTokenDialog ? 'pointer-events-none blur-sm' : ''}`}>
          <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:py-8">
            {/* ---------------- Patient banner ---------------- */}
            <div className="overflow-hidden rounded-3xl border border-skeuo-surface bg-white shadow-sm">
              {sessionPhone ? (
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-skeuo-red to-skeuo-red-dark text-lg font-bold text-white shadow-lg shadow-skeuo-red/25">
                      {(sessionName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active session
                      </span>
                      <h2 className="mt-1.5 truncate text-lg font-bold text-skeuo-text sm:text-xl">
                        {sessionName || '—'}
                      </h2>
                      <p className="truncate text-sm text-skeuo-muted">{sessionPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-2xl border border-skeuo-surface bg-skeuo-base px-5 py-2.5 text-center sm:flex-none">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-skeuo-muted">Token</p>
                      <p className="text-lg font-black leading-tight text-skeuo-red">#{tokenNumber || '—'}</p>
                    </div>
                    <Button variant="outline" onClick={() => setOpenTokenDialog(true)} className="px-5 py-5">
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-skeuo-surface text-skeuo-muted">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-skeuo-text">No active session</h2>
                      <p className="text-sm text-skeuo-muted">Enter a token number to start recording vitals.</p>
                    </div>
                  </div>
                  <Button onClick={() => setOpenTokenDialog(true)} className="px-6 py-5 font-bold">
                    Enter Token
                  </Button>
                </div>
              )}
            </div>

            {/* ---------------- Step indicator ---------------- */}
            <div className="mt-6 flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition-colors ${step >= 1 ? 'bg-skeuo-red text-white shadow-md shadow-skeuo-red/30' : 'bg-white text-skeuo-muted ring-1 ring-skeuo-surface'
                    }`}
                >
                  {step > 1 ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    '1'
                  )}
                </span>
                <span className={`text-sm font-semibold ${step >= 1 ? 'text-skeuo-text' : 'text-skeuo-muted'}`}>
                  Measurements
                </span>
              </div>

              <div className={`h-px flex-1 transition-colors ${step > 1 ? 'bg-skeuo-red/40' : 'bg-skeuo-surface'}`} />

              <div className="flex items-center gap-2.5">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition-colors ${step === 2 ? 'bg-skeuo-red text-white shadow-md shadow-skeuo-red/30' : 'bg-white text-skeuo-muted ring-1 ring-skeuo-surface'
                    }`}
                >
                  2
                </span>
                <span className={`text-sm font-semibold ${step === 2 ? 'text-skeuo-text' : 'text-skeuo-muted'}`}>
                  Review &amp; History
                </span>
              </div>
            </div>

            {/* ---------------- Step 1 ---------------- */}
            {step === 1 && (
              <div className="mt-5">
                <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  <VitalCard
                    type={VitalType.HEIGHT}
                    toggleHeightUnit={toggleHeightUnit}
                    heightUnit={heightUnit}
                    customContent={
                      heightUnit === 'ft' ? (
                        <div className="flex items-baseline gap-1.5">
                          <input
                            type="number"
                            placeholder="--"
                            value={vitals.Height?.split('.')[0] || ''}
                            onChange={(e) => {
                              markTouched('Height');
                              const inches = vitals.Height?.split('.')[1] || '0';
                              handleUpdate('Height', `${e.target.value}.${inches}`);
                            }}
                            className={`w-12 bg-transparent text-3xl font-extrabold tracking-tight outline-none placeholder:text-skeuo-muted/40 sm:text-4xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${userTouched.Height ? 'text-skeuo-green' : 'text-skeuo-text'
                              }`}
                          />
                          <span className="text-sm font-semibold text-skeuo-muted">ft</span>
                          <input
                            type="number"
                            placeholder="--"
                            value={vitals.Height?.split('.')[1] || ''}
                            onChange={(e) => {
                              markTouched('Height');
                              const feet = vitals.Height?.split('.')[0] || '0';
                              handleUpdate('Height', `${feet}.${e.target.value}`);
                            }}
                            className={`w-12 bg-transparent text-3xl font-extrabold tracking-tight outline-none placeholder:text-skeuo-muted/40 sm:text-4xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${userTouched.Height ? 'text-skeuo-green' : 'text-skeuo-text'
                              }`}
                          />
                          <span className="text-sm font-semibold text-skeuo-muted">in</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <input
                            type="number"
                            placeholder="--"
                            value={Number.isFinite(parseFloat(vitals.Height)) ? String(Math.round(parseFloat(vitals.Height))) : ''}
                            onChange={(e) => {
                              markTouched('Height');
                              handleUpdate('Height', e.target.value.replace(/[^0-9]/g, ''));
                            }}
                            className={`w-20 bg-transparent text-3xl font-extrabold tracking-tight outline-none placeholder:text-skeuo-muted/40 sm:text-4xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${userTouched.Height ? 'text-skeuo-green' : 'text-skeuo-text'
                              }`}
                          />
                          <span className="text-sm font-semibold text-skeuo-muted">cm</span>
                        </div>
                      )
                    }
                  />

                  <VitalCard
                    type={VitalType.WEIGHT}
                    onChange={(val) => handleUpdate('Weight', val)}
                    onUserInput={() => markTouched('Weight')}
                    value={vitals.Weight}
                  />

                  <VitalCard
                    type={VitalType.BMI}
                    customContent={
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span
                          className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${userTouched.Height || userTouched.Weight
                              ? 'text-skeuo-green'
                              : 'text-skeuo-text'
                            }`}
                        >
                          {bmi ? bmi.value : '—'}
                        </span>
                        <span className={`text-xs font-bold ${bmi ? bmi.color : 'text-skeuo-muted'}`}>
                          {bmi ? bmi.label : 'Fill weight & height'}
                        </span>
                      </div>
                    }
                  />

                  <VitalCard
                    type={VitalType.TEMPERATURE}
                    onChange={handleTemperatureChange}
                    value={vitals.Temperature}
                    toggleTempUnit={toggleTempUnit}
                    tempUnit={tempUnit}
                  />

                  <VitalCard
                    type={VitalType.BLOOD_OXYGEN}
                    onChange={(val) => handleUpdate('Spo2', val)}
                    value={vitals.Spo2}
                  />

                  <VitalCard
                    type={VitalType.PULSE_RATE}
                    onChange={(val) => handleUpdate('PulseRate', val)}
                    value={vitals.PulseRate}
                  />

                  <div className="sm:col-span-2 lg:col-span-3">
                    <VitalCard
                      type={VitalType.BLOOD_PRESSURE}
                      onChange1={(val) => handleBPUpdate('value1', val)}
                      onChange2={(val) => handleBPUpdate('value2', val)}
                      isDualValue
                      value1={vitals.BP.value1}
                      value2={vitals.BP.value2}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-skeuo-surface pt-6 sm:mt-8">
                  <Button
                    onClick={handleNextStep}
                    disabled={loading}
                    className="w-full px-8 py-6 text-base font-bold shadow-lg shadow-skeuo-red/25 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>Next →</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ---------------- Step 2 ---------------- */}
            {step === 2 && (
              <div className="mt-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button onClick={() => setStep(1)} className="px-6 py-5">
                    ← Back
                  </Button>
                  <Button onClick={() => setShowVitalReport(true)} className="px-6 py-5 font-bold">
                    📋 View Vital Report
                  </Button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-skeuo-surface bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowHistory((p) => !p)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-skeuo-base/70 sm:p-6"
                  >
                    <div>
                      <h3 className="font-bold text-skeuo-text">Patient History</h3>
                      <p className="mt-0.5 text-sm text-skeuo-muted">Search previous vitals records by phone number</p>
                    </div>
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-skeuo-surface text-skeuo-muted transition-transform duration-300 ${showHistory ? 'rotate-180' : ''
                        }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {showHistory && (
                    <div className="space-y-4 border-t border-skeuo-surface p-5 sm:p-6">
                      <div className="flex flex-col gap-3 rounded-2xl border border-skeuo-surface bg-skeuo-base p-4 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">
                            Patient Phone Number
                          </label>
                          <div className="flex gap-2 items-center md:items-end">
                            <Input
                              placeholder="e.g. 03001234567"
                              value={historySearchPhone}
                              onChange={(e) => setHistorySearchPhone(e.target.value)}
                              className="w-full bg-white"
                            />
                            <Button onClick={handleSearchHistory} size="icon" className="shrink-0">
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={exportToExcel} disabled={!history.length} className="flex-1 sm:flex-none">
                            Excel
                          </Button>
                          <Button onClick={exportToPDF} disabled={!history.length} className="flex-1 sm:flex-none">
                            PDF
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-skeuo-surface">
                        <table className="w-full min-w-[600px] border-collapse text-left">
                          <thead>
                            <tr className="bg-skeuo-base">
                              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Date</th>
                              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">BP</th>
                              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Pulse</th>
                              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">SpO2</th>
                              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Temp</th>
                              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">W / H</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-skeuo-surface">
                            {fetching ? (
                              <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-sm text-skeuo-muted">
                                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-skeuo-muted" />
                                  Searching records…
                                </td>
                              </tr>
                            ) : history.length > 0 ? (
                              history.map((record: any) => (
                                <tr key={record.id} className="transition-colors hover:bg-skeuo-base/70">
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-skeuo-muted">
                                    {record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-skeuo-red">
                                    {record.systolic}/{record.diastolic}{' '}
                                    <span className="text-[10px] font-normal text-skeuo-muted">mmHg</span>
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-skeuo-text">{record.pulseRate} bpm</td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-skeuo-text">{record.bloodOxygen}%</td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-skeuo-text">
                                    {record.temperature}
                                    {record.temperatureUnit}
                                  </td>
                                  <td className="whitespace-nowrap px-5 py-4 text-sm text-skeuo-muted">
                                    {record.weight}kg / {record.height}cm
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-5 py-14 text-center">
                                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-skeuo-surface text-skeuo-muted">
                                    <Search className="h-5 w-5" />
                                  </div>
                                  <p className="mt-3 text-sm font-semibold text-skeuo-text">No history found</p>
                                  <p className="mt-0.5 text-xs text-skeuo-muted">
                                    Search by phone number to view previous records.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  )
}

export default VitalsPage