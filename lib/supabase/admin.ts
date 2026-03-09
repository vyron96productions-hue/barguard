import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Use only for trusted server-side operations
// (e.g. creating a business during signup). Never expose to the browser.
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key',
)
