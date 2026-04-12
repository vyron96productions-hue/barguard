'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type InviteInfo =
  | { valid: true;  email: string; client_role: string; business_name: string; expires_at: string }
  | { valid: false; reason: string }

const ROLE_LABELS: Record<string, string> = {
  admin:    'Admin',
  manager:  'Manager',
  employee: 'Employee',
}

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [inviteInfo,  setInviteInfo]  = useState<InviteInfo | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null)

  // For the "create account" form
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [done,        setDone]        = useState(false)

  useEffect(() => {
    if (!token) { setLoading(false); return }

    // Fetch invite info (public endpoint — no auth needed)
    fetch(`/api/auth/accept-invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setInviteInfo)
      .catch(() => setInviteInfo({ valid: false, reason: 'fetch_error' }))
      .finally(() => setLoading(false))

    // Check if user is already signed in
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setCurrentUser({ email: data.user.email })
    })
  }, [token])

  async function acceptAsLoggedInUser() {
    setSubmitting(true)
    setError(null)
    const res  = await fetch('/api/auth/accept-invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to accept invite')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  async function createAccountAndAccept(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSubmitting(true)
    setError(null)

    const res  = await fetch('/api/auth/accept-invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to accept invite')
      setSubmitting(false)
      return
    }

    // Sign in with the newly created account
    const supabase = createSupabaseBrowserClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password,
    })
    setSubmitting(false)
    if (signInErr) {
      setError(signInErr.message)
      return
    }
    setDone(true)
    setTimeout(() => { window.location.href = '/dashboard' }, 1500)
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Wrapper>
        <p className="text-slate-500 text-sm text-center">Checking invite…</p>
      </Wrapper>
    )
  }

  // ── No token ─────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <Wrapper>
        <p className="text-red-400 text-sm text-center">Invalid invite link — no token found.</p>
      </Wrapper>
    )
  }

  // ── Invalid invite ────────────────────────────────────────────────────────
  if (!inviteInfo?.valid) {
    const reason = (inviteInfo as any)?.reason ?? 'unknown'
    const msg =
      reason === 'expired'          ? 'This invite link has expired. Ask the bar owner to send a new one.' :
      reason === 'revoked'          ? 'This invite has been revoked.' :
      reason === 'already_accepted' ? 'This invite has already been accepted.' :
      'This invite link is invalid or no longer active.'
    return (
      <Wrapper>
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-2xl">✕</div>
          <h1 className="text-lg font-bold text-slate-100">Invite not valid</h1>
          <p className="text-sm text-slate-400">{msg}</p>
          <a href="/login" className="text-amber-400 text-sm hover:underline">Go to login</a>
        </div>
      </Wrapper>
    )
  }

  const info = inviteInfo  // narrowed to valid

  // ── Success state ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <Wrapper>
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-2xl">✓</div>
          <h1 className="text-lg font-bold text-slate-100">Welcome to {info.business_name}!</h1>
          <p className="text-sm text-slate-400">Redirecting you to the dashboard…</p>
        </div>
      </Wrapper>
    )
  }

  const roleLabel = ROLE_LABELS[info.client_role] ?? info.client_role

  // ── User is signed in ─────────────────────────────────────────────────────
  if (currentUser) {
    const emailMatches = currentUser.email.toLowerCase().trim() === info.email.toLowerCase().trim()
    return (
      <Wrapper>
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">◈</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">You're invited!</h1>
            <p className="text-sm text-slate-400 mt-1">
              Join <strong className="text-slate-200">{info.business_name}</strong> as{' '}
              <strong className="text-amber-400">{roleLabel}</strong>
            </p>
          </div>

          {emailMatches ? (
            <div className="space-y-3">
              <div className="px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-300">
                Signed in as <strong className="text-slate-100">{currentUser.email}</strong>
              </div>
              {error && (
                <p className="text-red-400 text-sm px-1">{error}</p>
              )}
              <button
                onClick={acceptAsLoggedInUser}
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold rounded-xl text-sm transition-colors"
              >
                {submitting ? 'Accepting…' : `Accept & Join ${info.business_name}`}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-300">
                This invite was sent to <strong>{info.email}</strong>, but you're signed in as{' '}
                <strong>{currentUser.email}</strong>. Sign out and sign in with the correct account.
              </div>
              <a
                href="/login"
                className="block text-center text-sm text-amber-400 hover:underline"
              >
                Sign in with a different account
              </a>
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  // ── User is NOT signed in — show create account form ─────────────────────
  return (
    <Wrapper>
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">◈</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">You're invited!</h1>
          <p className="text-sm text-slate-400 mt-1">
            Join <strong className="text-slate-200">{info.business_name}</strong> as{' '}
            <strong className="text-amber-400">{roleLabel}</strong>
          </p>
        </div>

        <form onSubmit={createAccountAndAccept} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={info.email}
              disabled
              className="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-slate-600">This email is pre-filled from your invite.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Create Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold rounded-xl text-sm transition-colors"
          >
            {submitting ? 'Creating account…' : 'Create Account & Join'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Already have an account?{' '}
          <a href={`/login?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`} className="text-amber-400 hover:underline">
            Sign in instead
          </a>
        </p>
      </div>
    </Wrapper>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <img src="/barguard_icon.png" alt="BarGuard" className="h-10 w-auto" />
          <span className="text-lg font-bold text-slate-100">BarGuard</span>
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
