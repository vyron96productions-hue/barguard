import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'BarGuard — Liquor Loss Detector',
  description: 'Detect liquor shrinkage before it costs thousands',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto px-10 py-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
