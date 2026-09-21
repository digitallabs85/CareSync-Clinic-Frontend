'use client'
import React from 'react'
import { Check, X } from 'lucide-react'

interface SuccessPopupProps {
  visible: boolean
  onDismiss: () => void
  title: string
  value?: string | number | null
  valueLabel?: string
  message?: string
  loading?: boolean        // ← new prop
  loadingMessage?: string  // ← new prop
}

export default function SuccessPopup({
  visible,
  onDismiss,
  title,
  value = null,
  valueLabel = '',
  message = '',
  loading = false,
  loadingMessage = 'Please wait…',
}: SuccessPopupProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[50%] w-full animate-in zoom-in-95 duration-200">

        {/* Close icon — hidden while loading */}
        <div className="flex justify-end pt-4 pr-4">
          {!loading && (
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="text-center pb-8 px-2">
          {loading ? (
            // ── Loading state ──
            <>
              <div className="flex justify-center mb-4">
                <svg className="animate-spin w-16 h-16 text-[#0297d6]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
              <p className="text-slate-500 text-sm">{loadingMessage}</p>
            </>
          ) : (
            // ── Success state ──
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <Check className="w-16 h-16 text-green-600" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>

              {value !== null && value !== undefined ? (
                <p className="my-4 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold text-[#0297d6]">{value}</span>
                  {valueLabel && (
                    <span className="-translate-y-1 font-medium text-slate-500">{valueLabel}</span>
                  )}
                </p>
              ) : (
                message && <p className="text-slate-600 mb-6">{message}</p>
              )}

              <button
                onClick={onDismiss}
                className="bg-[#0297d6] hover:bg-[#0280bb] text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}