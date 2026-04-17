'use client'

import { useEffect, useState } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition-colors shadow-lg flex items-center justify-center"
      title="Back to top"
      aria-label="Back to top"
    >
      ↑
    </button>
  )
}
