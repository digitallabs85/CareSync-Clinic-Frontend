'use client'
import { RefreshCw, Search, X, Phone, Hash, User, Video } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { apiService } from '@/app/_utils/apiService'
import Navbar from '../_components/Navbar'
import { usePageGuard } from '@/app/_utils/usePageGuard'
import { Router } from 'next/router'
import { useRouter } from 'next/navigation'

type SearchMode = 'token' | 'name' | 'phone'

interface Patient {
  id: string
  token: string
  firstName: string
  lastName?: string
  phoneNumber: string
  vitalsRecorded: boolean
  vitalsId: string | null   // ← add this
}

interface Doctor {
  id: string
  title: string
  firstName: string
  lastName: string
  photo?: string
  specializations: string[]
  experience: number
  doctorStatus: string
  onCall: boolean
}

/* ------------------------------------------------------------------ *
 *  Section — card + header + body in one component
 *  Defined here so this page controls its own layout.
 * ------------------------------------------------------------------ */
interface SectionProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  /** Extra classes on the outer card */
  className?: string
  /** Extra classes on the body (e.g. spacing between children) */
  bodyClassName?: string
}

const Section: React.FC<SectionProps> = ({
  icon,
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}) => (
  <section className={`overflow-hidden rounded-2xl border border-skeuo-surface bg-white shadow-sm ${className ?? ''}`}>
    <div className="flex flex-col gap-2 border-b border-skeuo-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-skeuo-red text-white">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-skeuo-text">{title}</h2>
          {subtitle && <p className="text-xs text-skeuo-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className={`p-4 sm:p-8 ${bodyClassName ?? ''}`}>{children}</div>
  </section>
)

/* ------------------------------------------------------------------ *
 *  Page
 * ------------------------------------------------------------------ */
const OnlineConsultPage = () => {
  const allowed = usePageGuard('onlineConsultation');

  const [searchMode, setSearchMode] = useState<SearchMode>('token')
  const [searchQuery, setSearchQuery] = useState('')
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  const [pickerPatient, setPickerPatient] = useState<Patient | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [videoVitalsId, setVideoVitalsId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement>(null)

  const loadPatients = async () => {
    setLoadingPatients(true)
    try {
      const data = await apiService.getTodayPatients()
      setAllPatients(data.filter((p: Patient) => p.vitalsRecorded))
    } catch (err) {
      console.error('Failed to load patients', err)
    } finally {
      setLoadingPatients(false)
    }
  }

  const loadDoctors = async () => {
    setLoadingDoctors(true)
    try {
      const data = await apiService.getAllDoctors()
      setDoctors(data)
    } catch (err) {
      console.error('Failed to load doctors', err)
    } finally {
      setLoadingDoctors(false)
    }
  }

  useEffect(() => { loadPatients(); loadDoctors() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const searchResults = allPatients.filter(p => {
    if (!searchQuery.trim()) return false
    const q = searchQuery.toLowerCase()
    if (searchMode === 'token') return String(p.token).toLowerCase().includes(q)
    if (searchMode === 'phone') return String(p.phoneNumber || '').toLowerCase().includes(q)
    const full = `${p.firstName} ${p.lastName || ''}`.toLowerCase()
    return full.includes(q)
  })

  const clearSearch = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const onlineDoctors = doctors.filter(d => d.doctorStatus === 'online')
  const availableDoctors = onlineDoctors.filter(d => !d.onCall)

  const handleConsultClick = (patient: Patient) => {
    setPickerPatient(patient)
  }

  const handleDoctorPick = (doctor: Doctor) => {
    if (!pickerPatient?.vitalsId) {
      showToast('Vitals not recorded yet for this patient')
      return
    }
    const query = new URLSearchParams({
      doctorId: doctor.id,
      doctorName: `${doctor.title} ${doctor.firstName} ${doctor.lastName}`,
      ...(pickerPatient.id ? { patientId: pickerPatient.id } : {}),
      ...(pickerPatient.token ? { patientToken: pickerPatient.token } : {}),
    })
    router.push(`/calls/outgoing/${pickerPatient.vitalsId}?${query.toString()}`)
    setPickerPatient(null)
  }

  const searchModeMeta: Record<SearchMode, { icon: React.ReactNode; placeholder: string; label: string }> = {
    name: { icon: <User size={14} />, placeholder: 'e.g. Saad Kamal or just Saad', label: 'Name' },
    token: { icon: <Hash size={14} />, placeholder: 'e.g. 12', label: 'Token' },
    phone: { icon: <Phone size={14} />, placeholder: 'e.g. 03001234567', label: 'Phone' },
  }

  if (!allowed) return null;

  return (
    <>
      <Navbar variant="onlineConsult" />

      <main className="min-h-screen bg-skeuo-base">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-8 pt-7 sm:px-6 sm:pb-10 sm:pt-8">

          {/* ================= Find Patient ================= */}
          <Section
            icon={<Search className="h-4 w-4" />}
            title="Find Patient for Today"
            subtitle="Search among today's patients whose vitals have been recorded"
            bodyClassName="space-y-3"
          >
            {/* Mode tabs */}
            <div className="inline-flex rounded-lg bg-skeuo-surface p-0.5">
              {(['name', 'token', 'phone'] as SearchMode[]).map(mode => {
                const active = searchMode === mode
                return (
                  <button
                    key={mode}
                    onClick={() => { setSearchMode(mode); setSearchQuery('') }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${active
                      ? 'bg-white text-skeuo-red shadow-sm'
                      : 'text-skeuo-muted hover:text-skeuo-text'
                      }`}
                  >
                    {searchModeMeta[mode].icon}
                    {searchModeMeta[mode].label}
                  </button>
                )
              })}
            </div>

            {/* Search input row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-skeuo-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={searchModeMeta[searchMode].placeholder}
                  className="w-full rounded-xl border border-skeuo-surface bg-white py-2.5 pl-9 pr-10 text-sm outline-none transition-colors focus:border-skeuo-red focus:ring-2 focus:ring-skeuo-red/15"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-skeuo-muted transition-colors hover:text-skeuo-text"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={loadPatients}
                disabled={loadingPatients}
                title="Refresh patients"
                className="rounded-xl border border-skeuo-surface px-3 py-2.5 text-skeuo-muted transition-colors hover:border-skeuo-red hover:text-skeuo-red"
              >
                <RefreshCw size={16} className={loadingPatients ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Results */}
            {searchQuery.trim() && (
              <div>
                {loadingPatients ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-skeuo-muted">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-skeuo-red border-t-transparent" />
                    Loading patients...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center text-sm text-skeuo-muted">
                    No patients found for today matching{' '}
                    <span className="font-semibold text-skeuo-text">"{searchQuery}"</span>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-xs font-semibold text-skeuo-muted">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="overflow-hidden rounded-xl border border-skeuo-surface">
                      <table className="w-full text-left">
                        <thead className="border-b border-skeuo-surface bg-skeuo-base">
                          <tr className="text-[11px] font-black uppercase tracking-widest text-skeuo-muted">
                            <th className="px-4 py-2.5">Token</th>
                            <th className="px-4 py-2.5">Name</th>
                            <th className="hidden px-4 py-2.5 sm:table-cell">Phone</th>
                            <th className="px-4 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-skeuo-surface">
                          {searchResults.map(p => (
                            <tr key={p.id} className="transition-colors hover:bg-skeuo-base/60">
                              <td className="px-4 py-3">
                                <span className="rounded-lg bg-skeuo-red/10 px-2.5 py-1 text-xs font-black text-skeuo-red">
                                  #{p.token}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-bold text-skeuo-text">{p.firstName} {p.lastName}</p>
                              </td>
                              <td className="hidden px-4 py-3 sm:table-cell">
                                <p className="text-sm text-skeuo-muted">{p.phoneNumber || '—'}</p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleConsultClick(p)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-skeuo-red px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-skeuo-red-dark"
                                >
                                  <Video size={14} />
                                  Consult
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </Section>

          {/* ================= Online Doctors ================= */}
          <Section
            icon={<User className="h-4 w-4" />}
            title="Online Doctors"
            subtitle={
              loadingDoctors
                ? 'Loading...'
                : `${onlineDoctors.length} doctor${onlineDoctors.length !== 1 ? 's' : ''} currently online`
            }
            action={
              <button
                onClick={loadDoctors}
                disabled={loadingDoctors}
                className="flex items-center gap-1.5 rounded-lg border border-skeuo-surface px-3 py-1.5 text-sm text-skeuo-muted transition-colors hover:border-skeuo-red hover:text-skeuo-red disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={loadingDoctors ? 'animate-spin' : ''} />
                Refresh
              </button>
            }
          >
            {loadingDoctors ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-skeuo-surface">
                    <div className="h-24 bg-skeuo-surface" />
                    <div className="space-y-2 p-3">
                      <div className="h-4 w-3/4 rounded bg-skeuo-surface" />
                      <div className="h-3 w-1/2 rounded bg-skeuo-surface/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : onlineDoctors.length === 0 ? (
              <div className="py-10 text-center text-sm text-skeuo-muted">
                No doctors are currently online
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {onlineDoctors.map(doc => (
                  <DoctorCard key={doc.id} doctor={doc} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </main>

      {/* ================= Doctor Picker Modal ================= */}
      {pickerPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-skeuo-surface px-5 py-3.5">
              <div>
                <h3 className="text-base font-bold text-skeuo-text">Select a Doctor</h3>
                <p className="mt-0.5 text-xs text-skeuo-muted">
                  Consulting for{' '}
                  <span className="font-semibold text-skeuo-text">
                    {pickerPatient.firstName} {pickerPatient.lastName}
                  </span>
                  {' '}— Token <span className="font-black text-skeuo-red">#{pickerPatient.token}</span>
                </p>
              </div>
              <button
                onClick={() => setPickerPatient(null)}
                className="rounded-lg p-1 text-skeuo-muted transition-colors hover:bg-skeuo-surface hover:text-skeuo-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {availableDoctors.length === 0 ? (
                <div className="py-8 text-center text-sm text-skeuo-muted">
                  No doctors are currently available
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {availableDoctors.map(doc => {
                    const initials = `${doc.firstName[0]}${doc.lastName[0]}`.toUpperCase()
                    const specs = Array.isArray(doc.specializations)
                      ? doc.specializations.slice(0, 2).join(' • ')
                      : ''
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleDoctorPick(doc)}
                        className="group flex items-center gap-3 rounded-xl border border-skeuo-surface p-3 text-left transition-all hover:border-skeuo-red/40 hover:bg-skeuo-red/5 hover:shadow-sm"
                      >
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-skeuo-red/10">
                          {doc.photo
                            ? <img src={doc.photo} alt={doc.firstName} className="h-full w-full object-cover" />
                            : <span className="text-base font-black text-skeuo-red/50">{initials}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-skeuo-text">
                            {doc.title} {doc.firstName} {doc.lastName}
                          </p>
                          {specs && <p className="mt-0.5 truncate text-[11px] font-semibold text-skeuo-red">{specs}</p>}
                          <p className="mt-0.5 text-[10px] text-skeuo-muted">{doc.experience} yr{doc.experience !== 1 ? 's' : ''} experience</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-skeuo-red opacity-0 transition-opacity group-hover:opacity-100">
                          Select →
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= Toast ================= */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-2xl animate-fade-in">
          <span>⚠</span> {toast}
        </div>
      )}
    </>
  )
}

/* ================= Doctor Card ================= */
const DoctorCard = ({ doctor }: { doctor: Doctor }) => {
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase()
  const specs = Array.isArray(doctor.specializations)
    ? doctor.specializations.slice(0, 2).join(' • ')
    : ''

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-skeuo-surface bg-white transition-all hover:border-skeuo-red/30 hover:shadow-md">
      {/* Header banner */}
      <div className="relative h-14 bg-gradient-to-br from-skeuo-red/10 to-skeuo-red/20">
        <span
          className={`absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${doctor.onCall
            ? 'border-amber-200 bg-amber-50 text-amber-600'
            : 'border-emerald-200 bg-emerald-50 text-emerald-600'
            }`}
        >
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${doctor.onCall ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {doctor.onCall ? 'On Call' : 'Online'}
        </span>
      </div>

      {/* Avatar */}
      <div className="-mt-12 flex justify-center">
        <div className="z-10 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-skeuo-red/10 shadow-md">
          {doctor.photo
            ? <img src={doctor.photo} alt={doctor.firstName} className="h-full w-full object-cover" />
            : <span className="text-2xl font-black text-skeuo-red/40">{initials}</span>}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center gap-1 px-3 pb-3 pt-1.5 text-center">
        <p className="text-sm font-bold leading-tight text-skeuo-text">
          {doctor.title} {doctor.firstName} {doctor.lastName}
        </p>
        {specs
          ? <p className="text-[11px] font-semibold text-skeuo-red">{specs}</p>
          : <p className="text-[11px] italic text-skeuo-muted">No specialization</p>}

        <div className="mt-2.5 w-full border-t border-skeuo-surface pt-2.5">
          <p className="text-[9px] font-black uppercase tracking-widest text-skeuo-muted">Experience</p>
          <p className="text-sm font-bold text-skeuo-text">{doctor.experience} yr{doctor.experience !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  )
}

export default OnlineConsultPage