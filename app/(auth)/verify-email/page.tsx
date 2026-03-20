'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const uid = searchParams.get('uid')
    const token = searchParams.get('token')
    if (uid && token) {
      router.replace(`/api/auth/verify-email?uid=${uid}&token=${token}`)
    } else {
      router.replace('/login?error=invalid_verification_link')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Verifying your email…</p>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
