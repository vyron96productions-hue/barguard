import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { TrialBanner } from '@/components/TrialBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileNav />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0">
          <TrialBanner>
            <div className="px-4 py-5 md:px-8 md:py-8 lg:px-10 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-8">
              {children}
            </div>
          </TrialBanner>
        </main>
      </div>
    </>
  )
}
