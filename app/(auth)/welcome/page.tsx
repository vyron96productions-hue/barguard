'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'account_created' })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }}
      />
      {/* Amber glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src="/barguard_icon.png" alt="BarGuard" className="h-16 w-auto" />
          <div className="text-left">
            <p className="text-xl font-bold text-slate-100 leading-none">BarGuard</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none tracking-widest uppercase">Loss Detection</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-10 shadow-2xl">

          {/* Checkmark */}
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-100 mb-3">
            Welcome to BarGuard
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-2">
            Your account has been created. You have a <span className="text-amber-400 font-semibold">14-day free trial</span> — no credit card required.
          </p>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Next, set up your bar profile so we can get your account ready.
          </p>

          {/* Steps */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {[
              { num: '1', label: 'Account', done: true },
              { num: '2', label: 'Profile', done: false },
              { num: '3', label: 'Plan', done: false },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                    step.done
                      ? 'bg-amber-500 border-amber-500 text-slate-900'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {step.done ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.num}
                  </div>
                  <span className={`text-[10px] ${step.done ? 'text-amber-400' : 'text-slate-600'}`}>{step.label}</span>
                </div>
                {i < 2 && (
                  <div className="w-12 h-px bg-slate-800 mx-1 mb-4" />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/profile?new=1')}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-900 font-bold py-3.5 rounded-xl text-sm transition-colors"
          >
            Set Up My Bar Profile →
          </button>

          <p className="mt-4 text-xs text-slate-600">
            You can also do this later from{' '}
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-400 underline transition-colors">
              your dashboard
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
