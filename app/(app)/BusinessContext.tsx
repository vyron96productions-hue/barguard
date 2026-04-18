'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ClientRole } from '@/lib/client-access'

interface BusinessData {
  businessName: string | null
  username:     string | null
  plan:         string | null
  trialEndsAt:  string | null
  isAdmin:      boolean     // internal BarGuard admin — unrelated to client_role
  clientRole:   ClientRole  // customer-facing permission tier
  isOwner:      boolean
  /** True while the initial fetch is in flight */
  loading:      boolean
}

const defaultData: BusinessData = {
  businessName: null,
  username:     null,
  plan:         null,
  trialEndsAt:  null,
  isAdmin:      false,
  clientRole:   'employee', // most-restrictive default while loading — gates resolve once fetch completes
  isOwner:      false,
  loading:      true,
}

const BusinessContext = createContext<BusinessData>(defaultData)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BusinessData>(defaultData)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setData({
          businessName: d.business_name ?? null,
          username:     d.username      ?? null,
          plan:         d.plan          ?? null,
          trialEndsAt:  d.trial_ends_at ?? null,
          isAdmin:      d.is_admin      ?? false,
          clientRole:   d.client_role   ?? 'admin',
          isOwner:      d.is_owner      ?? false,
          loading:      false,
        })
      })
      .catch(() => setData({ ...defaultData, loading: false }))
  }, [])

  return (
    <BusinessContext.Provider value={data}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusinessContext() {
  return useContext(BusinessContext)
}
