'use client'
import React, { useState } from 'react'
import { Printer, X, ChevronDown, FileDown, MessageCircle, Mail } from 'lucide-react'
import app from "@/app.json"
import { COUNTRY_DIAL_CODES, CountryDialInfo, resolveCountryAndLocal, validatePhoneForCountry, buildWhatsAppLink } from '@/app/_utils/whatsapp'
import { CountryCodeSelect } from '../../_components/CountryCodeSelect'

const BRAND_HEX = '#ef4444'

interface Props {
    isOpen: boolean
    onClose: () => void
    prescription: any // { patient, medicines, diagnosis, hematologicalTest, radiologicalTest, clinicalNotes, token, createdAt }
}

const shouldShow = (v: any) => v != null && String(v).trim() !== ''

const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#555', letterSpacing: 1 }}>{label}</span>
        <span style={{ fontWeight: 800, color: '#111' }}>{value}</span>
    </div>
)

const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: BRAND_HEX, borderBottom: `1px solid ${BRAND_HEX}`, paddingBottom: 8, marginBottom: 6, marginTop: 10 }}>
        {title}
    </div>
)

const PrescriptionReportModal: React.FC<Props> = ({ isOpen, onClose, prescription }) => {
    const [showActionDropdown, setShowActionDropdown] = useState(false)
    const [showWhatsappConfirm, setShowWhatsappConfirm] = useState(false)
    const [waCountry, setWaCountry] = useState<CountryDialInfo>(COUNTRY_DIAL_CODES[0])
    const [waLocalNumber, setWaLocalNumber] = useState('')
    const [waError, setWaError] = useState<string | null>(null)
    const [isSavingPdf, setIsSavingPdf] = useState(false)

    if (!isOpen || !prescription) return null
    const p = prescription.patient || {}
    const patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim()

    const buildMessage = () => {
        const lines: string[] = [app.name, '_Prescription_', '', `*Patient:* ${patientName}`]
        if (p.age) lines.push(`*Age/Sex:* ${p.age}Y / ${p.gender ?? ''}`)
        if (prescription.token) lines.push(`*Token:* #${prescription.token}`)
        lines.push(`*Date:* ${new Date(prescription.createdAt || Date.now()).toLocaleDateString()}`)
        if (shouldShow(prescription.diagnosis)) lines.push('', '*DIAGNOSIS*', prescription.diagnosis)
        if (prescription.medicines?.length) {
            lines.push('', '*MEDICINES*')
            prescription.medicines.forEach((m: any) =>
                lines.push(`- ${m.name} ${m.dosage || ''} ${m.frequency || ''} ${m.duration || ''}`.trim())
            )
        }
        if (shouldShow(prescription.hematologicalTest)) lines.push('', '*HEMATOLOGICAL TESTS*', prescription.hematologicalTest)
        if (shouldShow(prescription.radiologicalTest)) lines.push('', '*RADIOLOGICAL TESTS*', prescription.radiologicalTest)
        if (shouldShow(prescription.clinicalNotes)) lines.push('', '*NOTES*', prescription.clinicalNotes)
        lines.push('', `_This digital report from ${app.name} does not require stamp or signature and is not valid for legal proceedings._`)
        return lines.join('\n')
    }

    const handleOpenWhatsapp = () => {
        setShowActionDropdown(false)
        const resolved = resolveCountryAndLocal(undefined, p.phoneNumber)
        setWaCountry(resolved.country)
        setWaLocalNumber(resolved.local)
        setShowWhatsappConfirm(true)
    }

    const handleConfirmSendWhatsapp = () => {
        const check = validatePhoneForCountry(waLocalNumber, waCountry)
        if (!check.valid) { setWaError(check.message || 'Invalid phone number'); return }
        window.open(buildWhatsAppLink(waCountry, waLocalNumber, buildMessage()), '_blank')
        setShowWhatsappConfirm(false)
    }

    const handleEmail = () => {
        setShowActionDropdown(false)
        const subject = encodeURIComponent(`Prescription - ${patientName}`)
        const body = encodeURIComponent(buildMessage())
        window.location.href = `mailto:${p.email || ''}?subject=${subject}&body=${body}`
    }

    const handlePrintClick = () => {
        const el = document.getElementById('rx-report-paper')
        if (!el) return
        const win = window.open('', '_blank', 'width=420,height=900')
        if (!win) return
        win.document.write(`
      <html><head><title>Prescription</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:monospace;background:#fff;color:#111;padding:24px;width:340px;margin:0 auto}
        img{display:block;margin:0 auto 6px;height:44px}
        .sec{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:${BRAND_HEX};border-bottom:1px solid ${BRAND_HEX};padding-bottom:2px;margin:10px 0 6px}
        .row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px}
      </style></head><body>${el.innerHTML}
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `)
        win.document.close()
    }

    const handleSaveAsPdf = async () => {
        setShowActionDropdown(false)
        const el = document.getElementById('rx-report-paper')
        if (!el) return
        setIsSavingPdf(true)
        try {
            const { default: jsPDF } = await import('jspdf')
            const { default: html2canvas } = await import('html2canvas')
            const THERMAL_WIDTH_PT = 80 * 72 / 25.4
            const iframe = document.createElement('iframe')
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;border:none;'
            document.body.appendChild(iframe)
            const doc = iframe.contentDocument!
            doc.open()
            doc.write(`<html><head><style>*{margin:0;padding:0;box-sizing:border-box;font-family:monospace}body{background:#fff;color:#111;padding:16px;display:inline-block}</style></head><body>${el.innerHTML}</body></html>`)
            doc.close()
            await new Promise(r => setTimeout(r, 300))
            const canvas = await html2canvas(doc.body, { scale: 2, useCORS: true, backgroundColor: '#fff' })
            document.body.removeChild(iframe)
            const imgData = canvas.toDataURL('image/png')
            const scaleFactor = THERMAL_WIDTH_PT / (canvas.width / 2)
            const pdf = new jsPDF({ unit: 'pt', format: [THERMAL_WIDTH_PT, (canvas.height / 2) * scaleFactor] })
            pdf.addImage(imgData, 'PNG', 0, 0, THERMAL_WIDTH_PT, (canvas.height / 2) * scaleFactor)
            pdf.save(`${patientName.replace(/\s+/g, '_') || 'Prescription'}.pdf`)
        } finally { setIsSavingPdf(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-skeuo-surface px-5 py-4">
                    <h3 className="text-base font-black uppercase tracking-widest text-skeuo-text">Prescription</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto bg-skeuo-base p-4">
                    <div id="rx-report-paper" className="mx-auto rounded-2xl border border-skeuo-surface bg-white shadow-sm" style={{ fontFamily: 'monospace', width: 300, padding: 16 }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 10 }}>
                            <img src="/logo.png" alt={app.name} style={{ height: 56, margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Prescription</div>
                            <div style={{ fontSize: 10, fontWeight: 700 }}>{app.name}</div>
                        </div>

                        <div style={{ borderBottom: '1px dashed #bbb', paddingBottom: 8, marginBottom: 4 }}>
                            <Row label="Name" value={patientName} />
                            {p.age && <Row label="Age" value={`${p.age} yrs`} />}
                            {p.gender && <Row label="Gender" value={p.gender} />}
                            {prescription.token && <Row label="Token" value={`#${prescription.token}`} />}
                            <Row label="Date" value={new Date(prescription.createdAt || Date.now()).toLocaleDateString()} />
                        </div>

                        {shouldShow(prescription.diagnosis) && (<><SectionTitle title="Diagnosis" /><p style={{ fontSize: 11 }}>{prescription.diagnosis}</p></>)}

                        {prescription.medicines?.length > 0 && (
                            <>
                                <SectionTitle title="Medicines" />
                                {prescription.medicines.map((m: any, i: number) => (
                                    <div key={i} style={{ fontSize: 11, marginBottom: 4 }}>
                                        <b>{i + 1}. {m.name}</b> — {m.dosage} {m.frequency} {m.duration}
                                    </div>
                                ))}
                            </>
                        )}

                        {shouldShow(prescription.hematologicalTest) && (<><SectionTitle title="Hematological Tests" /><p style={{ fontSize: 11 }}>{prescription.hematologicalTest}</p></>)}
                        {shouldShow(prescription.radiologicalTest) && (<><SectionTitle title="Radiological Tests" /><p style={{ fontSize: 11 }}>{prescription.radiologicalTest}</p></>)}
                        {shouldShow(prescription.clinicalNotes) && (<><SectionTitle title="Notes" /><p style={{ fontSize: 11 }}>{prescription.clinicalNotes}</p></>)}

                        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 8, letterSpacing: 2 }}>
                            This Digital Report from {app.name} does not require stamp or signature and is not valid for Legal proceedings.
                        </div>
                    </div>
                </div>

                {showWhatsappConfirm && (
                    <div className="absolute left-4 right-4 bottom-4 z-50 space-y-3 rounded-2xl border border-skeuo-surface bg-emerald-50 px-5 py-4 shadow-2xl">
                        <div className="flex gap-2">
                            <CountryCodeSelect value={waCountry} options={COUNTRY_DIAL_CODES} onChange={(c) => { setWaCountry(c); setWaError(null) }} />
                            <input type="tel" value={waLocalNumber} onChange={e => { setWaLocalNumber(e.target.value); setWaError(null) }}
                                className="min-w-0 flex-1 rounded-xl border-2 border-[#25D366] bg-white px-3 py-2 text-xs font-bold outline-none" placeholder="3001234567" autoFocus />
                        </div>
                        {waError && <p className="text-[11px] font-bold text-red-500">{waError}</p>}
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowWhatsappConfirm(false)} className="flex-1 rounded-xl border border-skeuo-surface py-2.5 text-xs font-bold">Cancel</button>
                            <button onClick={handleConfirmSendWhatsapp} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white">
                                <MessageCircle size={12} />Open WhatsApp
                            </button>
                        </div>
                    </div>
                )}

                <div className="relative flex gap-2 border-t border-skeuo-surface px-5 py-4">
                    <button onClick={handlePrintClick} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-skeuo-red-dark py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-skeuo-red">
                        <Printer size={15} />Print
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowActionDropdown(p => !p)} className="flex h-full items-center gap-1 rounded-2xl bg-skeuo-red-dark px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-skeuo-red">
                            Action <ChevronDown size={13} />
                        </button>
                        {showActionDropdown && (
                            <div className="absolute bottom-full right-0 z-10 mb-2 w-48 overflow-hidden rounded-2xl border border-skeuo-surface bg-white shadow-xl">
                                <button onClick={handleOpenWhatsapp} className="flex w-full items-center gap-2 px-4 py-3 text-xs font-bold hover:bg-skeuo-base">
                                    <MessageCircle size={13} className="text-[#25D366]" />Send via WhatsApp
                                </button>
                                <div className="border-t border-skeuo-surface" />
                                <button onClick={handleEmail} className="flex w-full items-center gap-2 px-4 py-3 text-xs font-bold hover:bg-skeuo-base">
                                    <Mail size={13} className="text-skeuo-red" />Send via Email
                                </button>
                                <div className="border-t border-skeuo-surface" />
                                <button onClick={handleSaveAsPdf} disabled={isSavingPdf} className="flex w-full items-center gap-2 px-4 py-3 text-xs font-bold hover:bg-skeuo-base disabled:opacity-50">
                                    <FileDown size={13} className="text-skeuo-red" />Save as PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PrescriptionReportModal