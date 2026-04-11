import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status — BarGuard',
  description: 'Check the current operational status of BarGuard services — API, database, POS integrations, and email processing.',
  alternates: { canonical: 'https://barguard.app/status' },
  openGraph: { url: 'https://barguard.app/status' },
}

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
