//app/dashboard/vitals/_components/VitalReportModal.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { Printer, X, Loader2, ChevronDown, FileDown, MessageCircle } from 'lucide-react'
import { apiService } from '@/app/_utils/apiService'
import { downloadPDF } from '@/app/_utils/pdfExport'
import app from "@/app.json"
import { COUNTRY_DIAL_CODES, CountryDialInfo, resolveCountryAndLocal, validatePhoneForCountry, buildWhatsAppLink } from '@/app/_utils/whatsapp'
import { CountryCodeSelect } from '../../_components/CountryCodeSelect'

/* Brand accent used inside the printed report (hex, not a Tailwind class,
   because it's injected into an iframe / print window and html2canvas). */
const BRAND_HEX = '#ef4444' // = --color-skeuo-red

interface VitalReportModalProps {
    isOpen: boolean
    onClose: () => void
    vitalsId: string | null
    patientId: string | null
    patientName: string
    patientAge?: number | string
    patientGender?: string
    patientPhone?: string
    token?: string
}

const shouldShow = (value: any): boolean => {
    if (value == null) return false
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed === '') return false
    }
    return true
}

const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#555', letterSpacing: 1 }}>{label}</span>
        <span style={{ fontWeight: 800, color: '#111' }}>{value}</span>
    </div>
)

const SectionTitle = ({ title }: { title: string }) => (
    <div style={{
        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2,
        color: BRAND_HEX, borderBottom: `1px solid ${BRAND_HEX}`, paddingBottom: 8, marginBottom: 6, marginTop: 10
    }}>
        {title}
    </div>
)

const VitalReportModal: React.FC<VitalReportModalProps> = ({
    isOpen, onClose, vitalsId, patientId, patientName, patientAge, patientGender, patientPhone, token
}) => {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showActionDropdown, setShowActionDropdown] = useState(false)
    const [isSavingPdf, setIsSavingPdf] = useState(false)

    const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sent' | 'error'>('idle')
    const [showWhatsappConfirm, setShowWhatsappConfirm] = useState(false)
    const [waCountry, setWaCountry] = useState<CountryDialInfo>(COUNTRY_DIAL_CODES[0])
    const [waLocalNumber, setWaLocalNumber] = useState('')
    const [waError, setWaError] = useState<string | null>(null)

    // ── Fetch vitals via GET /api/vitals/patient/:patientId, filter by vitalsId ──
    useEffect(() => {
        if (!isOpen || !vitalsId || !patientId) return
        setLoading(true)
        setError(null)
        apiService.getVitalsByPatient(patientId)
            .then(res => {
                const list = Array.isArray(res) ? res : res?.vitals || []
                const match = list.find((v: any) => v.id === vitalsId)
                if (match) setReport(match)
                else setError('Vitals record not found')
            })
            .catch(err => setError(err.message || 'Network error'))
            .finally(() => setLoading(false))
    }, [isOpen, vitalsId, patientId])


    const formatHeight = (h: string, unit?: string) => {
        if (!h) return '—';
        if (unit === 'cm') return `${parseFloat(h).toFixed(0)} cm`;
        const totalInches = parseFloat(h) / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        return `${ft}ft ${inch}in`;
    };

    const formatTemp = (v: any) => {
        if (!shouldShow(v.temperature)) return null
        const t = parseFloat(v.temperature)
        if (isNaN(t)) return v.temperature
        return v.temperatureUnit === '°F' ? `${((t * 9 / 5) + 32).toFixed(1)}°F` : `${t.toFixed(1)}°C`
    }

    const buildWhatsappMessage = (): string | null => {
        if (!report) return null
        const v = report
        const lines: string[] = []
        lines.push(app.name)
        lines.push('_Vital Report_')
        lines.push('')
        lines.push(`*Patient:* ${patientName}`)
        if (patientAge) lines.push(`*Age/Sex:* ${patientAge}Y / ${patientGender ?? ''}`)
        if (token) lines.push(`*Token:* #${token}`)
        lines.push(`*Date:* ${new Date().toLocaleDateString()}`)

        const vitalLines: string[] = []
        if (shouldShow(v.systolic) && shouldShow(v.diastolic)) vitalLines.push(`BP: ${v.systolic}/${v.diastolic} mmHg`)
        if (shouldShow(v.bloodOxygen)) vitalLines.push(`SpO2: ${v.bloodOxygen}%`)
        if (shouldShow(v.pulseRate)) vitalLines.push(`Pulse: ${v.pulseRate} bpm`)
        const temp = formatTemp(v)
        if (temp) vitalLines.push(`Temp: ${temp}`)
        if (shouldShow(v.weight)) vitalLines.push(`Weight: ${v.weight} kg`)
        if (shouldShow(v.height)) vitalLines.push(`Height: ${formatHeight(v.height, v.heightUnit)}`)
        if (shouldShow(v.bmi)) vitalLines.push(`BMI: ${v.bmi}`)
        if (vitalLines.length) {
            lines.push('')
            lines.push('*VITALS*')
            lines.push(...vitalLines)
        }

        lines.push('')
        lines.push(`_This digital report from ${app.name} does not require stamp or signature and is not valid for legal proceedings._`)
        lines.push('')
        lines.push(`Thank you for using ${app.name} Digital Health.`)
        lines.push(`For more information or assistance, please contact us:`)
        lines.push(`info@${app.name.toLowerCase()}.com`)
        lines.push(`https://www.${app.name.toLowerCase()}.com`)

        return lines.join('\n')
    }

    const handleOpenWhatsapp = () => {
        setShowActionDropdown(false)
        setWhatsappStatus('idle')
        setWaError(null)
        const resolved = resolveCountryAndLocal(undefined, patientPhone)
        setWaCountry(resolved.country)
        setWaLocalNumber(resolved.local)
        setShowWhatsappConfirm(true)
    }

    const handleConfirmSendWhatsapp = () => {
        setWaError(null)
        const check = validatePhoneForCountry(waLocalNumber, waCountry)
        if (!check.valid) {
            setWaError(check.message || 'Invalid phone number')
            return
        }
        const message = buildWhatsappMessage()
        if (!message) {
            setWhatsappStatus('error')
            setTimeout(() => setWhatsappStatus('idle'), 3000)
            return
        }
        const waLink = buildWhatsAppLink(waCountry, waLocalNumber, message)
        window.open(waLink, '_blank')
        setWhatsappStatus('sent')
        setShowWhatsappConfirm(false)
        setTimeout(() => setWhatsappStatus('idle'), 3000)
    }

    const handleWebPrint = () => {
        const el = document.getElementById('vital-report-paper')
        if (!el) return
        const win = window.open('', '_blank', 'width=420,height=900')
        if (!win) return
        win.document.write(`
      <html><head><title>Vital Report</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:monospace;background:#fff;color:#111;padding:24px;width:340px;margin:0 auto}
        img{display:block;margin:0 auto 6px;height:44px}
        .sec{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:${BRAND_HEX};border-bottom:1px solid ${BRAND_HEX};padding-bottom:2px;margin:10px 0 6px}
        .row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px}
        .lbl{font-weight:700;text-transform:uppercase;color:#555;letter-spacing:.5px}
        .val{font-weight:800;color:#111}
        .foot{text-align:center;font-size:8px;text-transform:uppercase;letter-spacing:2px;opacity:.4;margin-top:16px}
      </style></head><body>
      ${el.innerHTML}
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `)
        win.document.close()
    }

    const handlePrintClick = () => {
        handleWebPrint()
    }


    const handleSaveAsPdf = async () => {
        setShowActionDropdown(false);
        const el = document.getElementById('vital-report-paper');
        if (!el || !report) return;

        setIsSavingPdf(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const THERMAL_WIDTH_MM = 80;
            const THERMAL_WIDTH_PT = THERMAL_WIDTH_MM * 72 / 25.4;

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:auto;height:auto;border:none;';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument!;
            iframeDoc.open();
            iframeDoc.write(`
      <html>
        <head>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; font-family:monospace; }
            body { background:#fff; color:#111; padding:16px; display:inline-block; width:auto; }
            img { display:block; margin:0 auto 4px; height:44px; }
          </style>
        </head>
        <body>${el.innerHTML}</body>
      </html>
    `);
            iframeDoc.close();

            await new Promise((r) => setTimeout(r, 300));

            const body = iframeDoc.body;
            const contentWidth = body.scrollWidth;
            const contentHeight = body.scrollHeight;

            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(body, {
                scale: 2, useCORS: true, backgroundColor: '#ffffff',
                width: contentWidth, height: contentHeight,
                windowWidth: contentWidth, windowHeight: contentHeight,
            });

            document.body.removeChild(iframe);

            const imgData = canvas.toDataURL('image/png');
            const imgWidthPt = canvas.width / 2;
            const imgHeightPt = canvas.height / 2;
            const scaleFactor = THERMAL_WIDTH_PT / imgWidthPt;
            const pdfWidth = THERMAL_WIDTH_PT;
            const pdfHeight = imgHeightPt * scaleFactor;

            const pdf = new jsPDF({ unit: 'pt', format: [pdfWidth, pdfHeight] });
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const fileName = `${patientName.replace(/\s+/g, '_') || 'Patient'}.pdf`;
            downloadPDF(pdf, fileName);
        } catch (err) {
            console.error('PDF save error:', err);
            alert('Failed to save PDF');
        } finally {
            setIsSavingPdf(false);
        }
    };

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
                <div className="relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-skeuo-surface px-5 py-4">
                        <h3 className="text-base font-black uppercase tracking-widest text-skeuo-text">Vital Report Preview</h3>
                        <button onClick={onClose} className="text-skeuo-muted transition-colors hover:text-skeuo-text cursor-pointer"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-skeuo-base p-4">
                        {loading && (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="mr-2 animate-spin text-skeuo-red" size={24} /> <span className="text-skeuo-text">Loading report...</span>
                            </div>
                        )}
                        {error && (
                            <div className="py-4 text-center text-skeuo-red">Error: {error}</div>
                        )}
                        {!loading && !error && report && (
                            <div id="vital-report-paper" className="mx-auto rounded-2xl border border-skeuo-surface bg-white shadow-sm" style={{ fontFamily: 'monospace', width: 300, padding: 16 }}>
                                <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 10 }}>
                                    <img src="/logo.png" alt={app.name} style={{ height: 56, margin: '0 auto 6px' }} />
                                    <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Vital Report</div>
                                    <div style={{ fontSize: 10, fontWeight: 700 }}>{app.name}</div>
                                </div>

                                <div style={{ borderBottom: '1px dashed #bbb', paddingBottom: 8, marginBottom: 4 }}>
                                    <Row label="Name" value={patientName} />
                                    {patientAge && <Row label="Age" value={`${patientAge} yrs`} />}
                                    {patientGender && <Row label="Gender" value={patientGender} />}
                                    {token && <Row label="Token" value={`#${token}`} />}
                                    <Row label="Date" value={new Date().toLocaleDateString()} />
                                    <Row label="Time" value={report.createdAt ? new Date(report.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString()} />
                                </div>

                                {(() => {
                                    const v = report
                                    const hasVitals = shouldShow(v.pulseRate) || shouldShow(v.bloodOxygen) || shouldShow(v.systolic) || shouldShow(v.temperature) || shouldShow(v.weight) || shouldShow(v.height)
                                    if (!hasVitals) return null
                                    return (
                                        <>
                                            <SectionTitle title="Vitals" />
                                            {shouldShow(v.systolic) && shouldShow(v.diastolic) && <Row label="Blood Pressure" value={`${v.systolic}/${v.diastolic} mmHg`} />}
                                            {shouldShow(v.bloodOxygen) && <Row label="SpO2" value={`${v.bloodOxygen}%`} />}
                                            {shouldShow(v.pulseRate) && <Row label="Pulse Rate" value={`${v.pulseRate} bpm`} />}
                                            {formatTemp(v) && <Row label="Temperature" value={formatTemp(v)!} />}
                                            {shouldShow(v.weight) && <Row label="Weight" value={`${v.weight} kg`} />}
                                            {shouldShow(v.height) && <Row label="Height" value={formatHeight(v.height, v.heightUnit)} />}
                                            {shouldShow(v.bmi) && <Row label="BMI" value={v.bmi} />}
                                        </>
                                    )
                                })()}

                                <div className="foot" style={{ marginTop: 16, textAlign: 'center', fontSize: 8, letterSpacing: 2, opacity: 1 }}>
                                    This Digital Report from {app.name} does not require stamp or signature
                                    and is not valid for Legal proceedings.
                                </div>
                            </div>
                        )}
                    </div>

                    {showWhatsappConfirm && (
                        <div className="absolute left-4 right-4 bottom-4 z-50 space-y-3 overflow-x-hidden rounded-2xl border border-skeuo-surface bg-emerald-50 px-5 py-4 shadow-2xl">
                            <div className="flex min-w-0 gap-2">
                                <CountryCodeSelect
                                    value={waCountry}
                                    options={COUNTRY_DIAL_CODES}
                                    onChange={(c) => { setWaCountry(c); setWaError(null) }}
                                />
                                <input
                                    type="tel"
                                    value={waLocalNumber}
                                    onChange={e => { setWaLocalNumber(e.target.value); setWaError(null) }}
                                    className="min-w-0 flex-1 rounded-xl border-2 border-[#25D366] bg-white px-3 py-2 text-xs font-bold outline-none"
                                    placeholder="3001234567"
                                    autoFocus
                                />
                            </div>
                            {waError && <p className="text-[11px] font-bold text-red-500">{waError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => { setShowWhatsappConfirm(false); setWaError(null) }}
                                    className="flex-1 rounded-xl border border-skeuo-surface py-2.5 text-xs font-bold text-skeuo-text hover:bg-skeuo-surface/60"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSendWhatsapp}
                                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white hover:bg-[#1ebe5a]"
                                >
                                    <MessageCircle size={12} />Open WhatsApp
                                </button>
                            </div>
                        </div>
                    )}

                    {whatsappStatus === 'error' && (
                        <div className="mx-5 mb-2 rounded-xl bg-red-100 px-3 py-2 text-center text-xs font-bold text-red-700">
                            Failed to prepare WhatsApp message. Try again.
                        </div>
                    )}

                    <div className="relative flex gap-2 border-t border-skeuo-surface px-5 py-4">
                        <button
                            onClick={handlePrintClick}
                            disabled={loading || !report }
                            className={`flex flex-1 items-center justify-center text-white cursor-pointer gap-2 bg-skeuo-red-dark rounded-2xl py-3.5 text-xs font-black uppercase tracking-widest transition-all
                                ${(loading || !report) ? 'cursor-not-allowed' : 'hover:bg-skeuo-red active:scale-95'}`}
                        >
                            <><Printer size={15} />Print</>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowActionDropdown(p => !p)}
                                disabled={loading || !report}
                                className={`flex h-full items-center gap-1 rounded-2xl text-white cursor-pointer bg-skeuo-red-dark px-4 py-3.5 text-xs font-black uppercase tracking-widest transition-all
                                    ${(loading || !report) ? 'cursor-not-allowed' : ' hover:bg-skeuo-red active:scale-95'}`}
                            >
                                Action <ChevronDown size={13} />
                            </button>

                            {showActionDropdown && (
                                <div className="absolute bottom-full right-0 z-10 mb-2 w-48 overflow-hidden rounded-2xl border border-skeuo-surface bg-white shadow-xl">
                                    <button
                                        onClick={handleOpenWhatsapp}
                                        className="flex w-full items-center gap-2 px-4 py-3 text-xs font-bold text-skeuo-text transition-colors hover:bg-skeuo-base"
                                    >
                                        <MessageCircle size={13} className="text-[#25D366]" />Send via WhatsApp
                                    </button>
                                    <div className="border-t border-skeuo-surface" />
                                    <button
                                        onClick={handleSaveAsPdf}
                                        disabled={isSavingPdf}
                                        className="flex w-full items-center gap-2 px-4 py-3 text-xs font-bold text-skeuo-text transition-colors hover:bg-skeuo-base disabled:opacity-50"
                                    >
                                        {isSavingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} className="text-skeuo-red" />}Save as PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default VitalReportModal