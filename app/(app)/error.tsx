'use client'

import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console in dev; in production Vercel captures this automatically
    console.error('[app] unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
      <p className="text-sm text-slate-400 max-w-sm">
        An unexpected error occurred. Try refreshing the page — if it keeps happening, contact support.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
