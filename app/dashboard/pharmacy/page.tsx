'use client'
import React, { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiService } from '@/app/_utils/apiService'
import Navbar from '../_components/Navbar'
import PrescriptionReportModal from './_components/PrescriptionReportModal'

type SearchType = 'name' | 'token' | 'mrNumber'

const PharmacyPage = () => {
    const [searchType, setSearchType] = useState<SearchType>('name')
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<any>(null)

    const handleSearch = async () => {
        if (!query.trim()) return
        setLoading(true)
        try {
            const res = await apiService.searchPrescriptions(searchType, query.trim())
            setResults(Array.isArray(res) ? res : [])
        } catch (err: any) {
            alert(err.message || 'Search failed')
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-skeuo-base">
            <Navbar variant="pharmacy" />
            <PrescriptionReportModal isOpen={!!selected} onClose={() => setSelected(null)} prescription={selected} />

            <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:py-8">
                <div className="rounded-3xl border border-skeuo-surface bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap gap-2">
                        {(['name', 'token', 'mrNumber'] as SearchType[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setSearchType(t)}
                                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${searchType === t ? 'bg-skeuo-red text-white' : 'bg-skeuo-base text-skeuo-muted'}`}
                            >
                                {t === 'mrNumber' ? 'MR Number' : t}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Input
                            placeholder={searchType === 'name' ? 'Patient name' : searchType === 'token' ? 'Token number' : 'MR number'}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="flex-1 bg-white"
                        />
                        <Button onClick={handleSearch} size="icon"><Search className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-skeuo-surface bg-white">
                    <table className="w-full min-w-[600px] border-collapse text-left">
                        <thead>
                            <tr className="bg-skeuo-base">
                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Patient</th>
                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Token</th>
                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Diagnosis</th>
                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted">Date</th>
                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-skeuo-muted"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-skeuo-surface">
                            {loading ? (
                                <tr><td colSpan={5} className="px-5 py-12 text-center"><Loader2 className="mx-auto animate-spin text-skeuo-muted" /></td></tr>
                            ) : results.length > 0 ? (
                                results.map((rx: any) => (
                                    <tr key={rx.id} className="hover:bg-skeuo-base/70">
                                        <td className="px-5 py-4 text-sm font-semibold text-skeuo-text">
                                            {rx.patient?.firstName} {rx.patient?.lastName}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-skeuo-red font-bold">#{rx.token}</td>
                                        <td className="px-5 py-4 text-sm text-skeuo-muted">{rx.diagnosis || '—'}</td>
                                        <td className="px-5 py-4 text-sm text-skeuo-muted">
                                            {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Button size="sm" onClick={() => setSelected(rx)}>View / Print</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-skeuo-muted">No results</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}

export default PharmacyPage