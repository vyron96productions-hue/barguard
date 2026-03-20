'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const expired = searchParams.get('expired') === '1'
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')

  async function resend() {
    setResending(true)
    setError('')
    const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
    const data = await res.json()
    setResending(false)
    if (res.ok) setResent(true)
    else setError(data.error ?? 'Failed to resend. Try again.')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="w-full max-w-sm relative text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src="/barguard_icon.png" alt="BarGuard" className="h-16 w-auto" />
          <div>
            <p className="text-xl font-bold text-slate-100 leading-none">BarGuard</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none tracking-widest uppercase">Loss Detection</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
            </svg>
          </div>

          {expired ? (
            <>
              <h1 className="text-lg font-semibold text-slate-100 mb-2">Link expired</h1>
              <p className="text-sm text-slate-500 mb-6">Your verification link has expired. Click below to get a new one.</p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-slate-100 mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-500 mb-6">We sent a verification link to your email. Click it to activate your account.</p>
            </>
          )}

          {resent ? (
            <p className="text-sm text-emerald-400 mb-4">Verification email sent!</p>
          ) : (
            <>
              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
              <button
                onClick={resend}
                disabled={resending}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold py-3 rounded-xl text-sm transition-colors mb-4"
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            </>
          )}

          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
