'use client'
import { RefreshCw, Search, X, Video, Users, Activity, ChevronRight } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { apiService } from '@/app/_utils/apiService'
import Navbar from '../_components/Navbar'
import { usePageGuard } from '@/app/_utils/usePageGuard'
import { useRouter } from 'next/navigation'
import PatientTable from './_components/PatientTable'

interface Patient {
  id: string
  token: string
  firstName: string
  lastName?: string
  phoneNumber: string
  vitalsRecorded: boolean
  vitalsId: string | null
  prescriptionId: string | null
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
 *  Padding and margins remain strictly UNTOUCHED as requested.
 * ------------------------------------------------------------------ */
interface SectionProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
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
  const allowed = usePageGuard('onlineConsultation')

  const [searchQuery, setSearchQuery] = useState('')
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  const [pickerPatient, setPickerPatient] = useState<Patient | null>(null)
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

  useEffect(() => { 
    loadPatients()
    loadDoctors() 
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Unified Omni-Search: Checks token, name, and phone simultaneously.
  const matchesQuery = (p: Patient) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      String(p.token).toLowerCase().includes(q) ||
      String(p.phoneNumber || '').toLowerCase().includes(q) ||
      `${p.firstName} ${p.lastName || ''}`.toLowerCase().includes(q)
    )
  }

  const pendingResults = allPatients.filter(p => !p.prescriptionId && matchesQuery(p))
  const completedResults = allPatients.filter(p => !!p.prescriptionId && matchesQuery(p))

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
    // Routing logic preserved exactly as requested
    router.push(`/calls/outgoing/${pickerPatient.vitalsId}?${query.toString()}`)
    setPickerPatient(null)
  }

  if (!allowed) return null

  return (
    <>
      <Navbar variant="onlineConsult" />

      <main className="min-h-screen bg-skeuo-base">
        {/* CSS Grid for side-by-side layout on desktop */}
        <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 px-4 pb-8 pt-7 sm:px-6 sm:pb-10 sm:pt-8">

          {/* ================= Left Column: Patient Management ================= */}
          <div className="flex flex-col gap-6">
            
            {/* Omni-Search Control Module */}
            <Section
              icon={<Search className="h-4 w-4" />}
              title="Search Patients"
              subtitle="Filter today's pending and completed consults"
              bodyClassName="py-4 sm:py-5" // Slimmer body specifically for the search bar
            >
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-skeuo-muted transition-colors group-focus-within:text-skeuo-red" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, token, or phone..."
                    className="w-full rounded-xl border-2 border-skeuo-surface bg-skeuo-base/30 py-3 pl-10 pr-10 text-sm font-medium outline-none transition-all focus:border-skeuo-red focus:bg-white focus:ring-4 focus:ring-skeuo-red/10"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-skeuo-muted hover:bg-skeuo-surface hover:text-skeuo-text"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={loadPatients}
                  disabled={loadingPatients}
                  title="Refresh patients"
                  className="flex shrink-0 items-center justify-center rounded-xl border-2 border-skeuo-surface bg-white px-4 py-3 text-skeuo-muted transition-colors hover:border-skeuo-red hover:text-skeuo-red focus:outline-none focus:ring-4 focus:ring-skeuo-red/10"
                >
                  <RefreshCw size={18} className={loadingPatients ? 'animate-spin' : ''} />
                </button>
              </div>
            </Section>

            {/* Pending Consults */}
            <Section
              icon={<Users className="h-4 w-4" />}
              title="Pending Consults"
              subtitle={loadingPatients ? 'Loading...' : `${pendingResults.length} patient${pendingResults.length !== 1 ? 's' : ''} awaiting prescription`}
            >
              {loadingPatients ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-skeuo-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-skeuo-red border-t-transparent" />
                  Loading patients...
                </div>
              ) : pendingResults.length === 0 ? (
                <div className="rounded-xl border border-dashed border-skeuo-surface bg-skeuo-base/50 py-12 text-center text-sm text-skeuo-muted">
                  {searchQuery.trim()
                    ? <>No pending patients matching <span className="font-semibold text-skeuo-text">"{searchQuery}"</span></>
                    : 'No patients pending consult today'}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <PatientTable patients={pendingResults} onConsult={handleConsultClick}  variant='pending'/>
                </div>
              )}
            </Section>

            {/* Completed Today */}
            <Section
              icon={<Video className="h-4 w-4" />}
              title="Completed Today"
              subtitle={loadingPatients ? 'Loading...' : `${completedResults.length} already prescribed, consult again if needed`}
            >
              {loadingPatients ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-skeuo-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-skeuo-red border-t-transparent" />
                  Loading patients...
                </div>
              ) : completedResults.length === 0 ? (
                <div className="rounded-xl border border-dashed border-skeuo-surface bg-skeuo-base/50 py-12 text-center text-sm text-skeuo-muted">
                  {searchQuery.trim()
                    ? <>No completed patients matching <span className="font-semibold text-skeuo-text">"{searchQuery}"</span></>
                    : 'No patients completed today'}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <PatientTable patients={completedResults} onConsult={handleConsultClick} variant='completed'/>
                </div>
              )}
            </Section>
          </div>

          {/* ================= Right Column: Live Doctor Roster ================= */}
          <div className="flex flex-col gap-6">
            <Section
              icon={<Activity className="h-4 w-4" />}
              title="Available Doctors"
              subtitle={`${onlineDoctors.length} doctor${onlineDoctors.length !== 1 ? 's' : ''} online`}
              className="h-full"
              bodyClassName="h-full flex flex-col"
              action={
                <button
                  onClick={loadDoctors}
                  disabled={loadingDoctors}
                  className="rounded-lg p-2 text-skeuo-muted transition-colors hover:bg-skeuo-surface hover:text-skeuo-red disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={14} className={loadingDoctors ? 'animate-spin' : ''} />
                </button>
              }
            >
              {loadingDoctors ? (
                <div className="flex flex-col gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-skeuo-surface p-3">
                      <div className="h-10 w-10 rounded-full bg-skeuo-surface" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-skeuo-surface" />
                        <div className="h-2 w-1/2 rounded bg-skeuo-surface/60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : onlineDoctors.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-skeuo-surface bg-skeuo-base/50 text-center text-sm text-skeuo-muted">
                  <Activity size={24} className="mb-2 opacity-20" />
                  No doctors are online
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {onlineDoctors.map(doc => (
                    <CompactDoctorCard key={doc.id} doctor={doc} />
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </main>

      {/* ================= Doctor Picker Modal ================= */}
      {pickerPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-skeuo-surface bg-skeuo-base/50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-skeuo-text">Dispatch to Doctor</h3>
                <p className="mt-1 text-sm text-skeuo-muted">
                  Assigning token <span className="font-black text-skeuo-red">#{pickerPatient.token}</span> ({pickerPatient.firstName})
                </p>
              </div>
              <button
                onClick={() => setPickerPatient(null)}
                className="rounded-full bg-white p-2 text-skeuo-muted shadow-sm transition-all hover:bg-skeuo-red hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {availableDoctors.length === 0 ? (
                <div className="py-12 text-center text-sm text-skeuo-muted">
                  <Activity size={32} className="mx-auto mb-3 opacity-20" />
                  No available doctors to dispatch to right now.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {availableDoctors.map(doc => {
                    const initials = `${doc.firstName[0]}${doc.lastName[0]}`.toUpperCase()
                    const specs = Array.isArray(doc.specializations)
                      ? doc.specializations.slice(0, 2).join(' • ')
                      : ''
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleDoctorPick(doc)}
                        className="group flex items-center justify-between rounded-xl border-2 border-skeuo-surface p-3 text-left transition-all hover:border-skeuo-red/40 hover:bg-skeuo-red/5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-skeuo-red/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-skeuo-red/10 border-2 border-white shadow-sm group-hover:border-skeuo-red/20">
                            {doc.photo
                              ? <img src={doc.photo} alt={doc.firstName} className="h-full w-full object-cover" />
                              : <span className="text-base font-black text-skeuo-red/50">{initials}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-skeuo-text">
                              {doc.title} {doc.firstName} {doc.lastName}
                            </p>
                            {specs && <p className="mt-0.5 truncate text-[11px] font-semibold text-skeuo-muted">{specs}</p>}
                          </div>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-skeuo-surface text-skeuo-muted transition-all group-hover:bg-skeuo-red group-hover:text-white">
                          <ChevronRight size={16} />
                        </div>
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
        <div className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-2xl animate-fade-in">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-xs">!</span> 
          {toast}
        </div>
      )}
    </>
  )
}

/* ================= Compact Doctor Card (For Roster List) ================= */
const CompactDoctorCard = ({ doctor }: { doctor: Doctor }) => {
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase()
  const specs = Array.isArray(doctor.specializations)
    ? doctor.specializations.slice(0, 1).join(', ')
    : ''

  return (
    <div className="flex items-center gap-3 rounded-xl border border-skeuo-surface bg-white p-3 shadow-sm transition-all hover:border-skeuo-red/20">
      <div className="relative">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-skeuo-red/10 shadow-sm">
          {doctor.photo
            ? <img src={doctor.photo} alt={doctor.firstName} className="h-full w-full object-cover" />
            : <span className="text-sm font-black text-skeuo-red/40">{initials}</span>}
        </div>
        <span
          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
            doctor.onCall ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
          title={doctor.onCall ? 'On Call' : 'Online'}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-skeuo-text">
            {doctor.title} {doctor.firstName} {doctor.lastName}
          </p>
          <span className="shrink-0 text-[10px] font-black uppercase text-skeuo-muted">
            {doctor.experience}Y
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] font-medium text-skeuo-muted">
            {specs || 'General'}
          </p>
          <p className={`shrink-0 text-[10px] font-bold ${doctor.onCall ? 'text-amber-500' : 'text-emerald-500'}`}>
            {doctor.onCall ? 'Busy' : 'Available'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default OnlineConsultPage