import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'

export interface ActivityLogEntry {
  id: string
  user_id: string | null
  display_name: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  inventory_count:  'Submitted inventory count',
  member_invited:   'Invited team member',
  member_removed:   'Removed team member',
  role_changed:     'Changed member role',
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export async function GET() {
  try {
    const ctx = await getAuthContext()
    requireMinimumClientRole(ctx, 'admin')

    const { supabase, businessId } = ctx

    const { data, error } = await supabase
      .from('team_activity_log')
      .select('id, user_id, display_name, action, details, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [])
  } catch (e) {
    return authErrorResponse(e, 'GET /api/team/activity')
  }
}
