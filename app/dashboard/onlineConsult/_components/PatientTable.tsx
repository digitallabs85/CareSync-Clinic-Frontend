'use client'
import { Video } from 'lucide-react'

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

interface PatientTableProps {
  patients: Patient[]
  onConsult: (p: Patient) => void
  variant?: 'pending' | 'completed'
}

const PatientTable = ({ patients, onConsult, variant = 'pending' }: PatientTableProps) => {
  const completed = variant === 'completed'

  return (
    <div className={`overflow-hidden rounded-xl border ${completed ? 'border-skeuo-surface/60' : 'border-skeuo-surface'}`}>
      <table className="w-full text-left">
        <thead className={`border-b border-skeuo-surface ${completed ? 'bg-skeuo-base/60' : 'bg-skeuo-base'}`}>
          <tr className="text-[11px] font-black uppercase tracking-widest text-skeuo-muted">
            <th className="px-4 py-2.5">Token</th>
            <th className="px-4 py-2.5">Name</th>
            <th className="hidden px-4 py-2.5 sm:table-cell">Phone</th>
            <th className="px-4 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-skeuo-surface">
          {patients.map(p => (
            <tr key={p.id} className={`transition-colors ${completed ? 'bg-skeuo-base/40 hover:bg-skeuo-base/60' : 'hover:bg-skeuo-base/60'}`}>
              <td className="px-4 py-3">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                    completed
                      ? 'bg-skeuo-muted/10 text-skeuo-muted'
                      : 'bg-skeuo-red/10 text-skeuo-red'
                  }`}
                >
                  #{p.token}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className={`text-sm font-bold ${completed ? 'text-skeuo-muted' : 'text-skeuo-text'}`}>
                  {p.firstName} {p.lastName}
                </p>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <p className="text-sm text-skeuo-muted">{p.phoneNumber || '—'}</p>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onConsult(p)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold text-white transition-colors ${
                    completed
                      ? 'bg-skeuo-muted hover:bg-skeuo-muted/80'
                      : 'bg-skeuo-red hover:bg-skeuo-red-dark'
                  }`}
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
  )
}

export default PatientTable