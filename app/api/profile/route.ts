import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { requireMinimumClientRole } from '@/lib/client-access'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { supabase, user, businessId, clientRole, isOwner } = await getAuthContext()

    const { data: biz } = await supabase
      .from('businesses')
      .select('name, address, contact_email, phone, bar_type, plan, stripe_customer_id, stripe_subscription_id, trial_ends_at')
      .eq('id', businessId)
      .single()

    const username = (user.user_metadata?.username as string | undefined)
      ?? user.email?.replace('@barguard.app', '')
      ?? null

    return NextResponse.json({
      username,
      bar_name:         biz?.name ?? '',
      address:          biz?.address ?? '',
      contact_email:    biz?.contact_email ?? '',
      phone:            (biz as any)?.phone ?? '',
      bar_type:         (biz as any)?.bar_type ?? '',
      plan:             biz?.plan ?? 'basic',
      has_subscription: !!biz?.stripe_customer_id,
      trial_ends_at:    biz?.trial_ends_at ?? null,
      client_role:      clientRole,
      is_owner:         isOwner,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getAuthContext()
    const { supabase, user, businessId } = ctx
    const body = await req.json()

    // ── Username change — owner only ──────────────────────────────────────
    // Username maps to username@barguard.app email. Only owners use this auth pattern.
    if (typeof body.username === 'string') {
      if (!ctx.isOwner) {
        return NextResponse.json({ error: 'Only the bar owner can change the username.' }, { status: 403 })
      }

      const newUsername = body.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
      if (!newUsername || !/^[a-z0-9_-]+$/.test(newUsername)) {
        return NextResponse.json({ error: 'Invalid username. Letters, numbers, _ and - only.' }, { status: 400 })
      }

      const newEmail = `${newUsername}@barguard.app`
      const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(user.id, {
        email:         newEmail,
        email_confirm: true,
        user_metadata: { ...(user.user_metadata ?? {}), username: newUsername },
      })

      if (updateErr) {
        const msg = updateErr.message.toLowerCase()
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          return NextResponse.json({ error: 'That username is already taken.' }, { status: 400 })
        }
        throw updateErr
      }

      return NextResponse.json({ ok: true, username: newUsername })
    }

    // ── Business info updates — admin/owner only ──────────────────────────
    // Managers and employees cannot change business settings.
    requireMinimumClientRole(ctx, 'admin')

    const updates: Record<string, string> = {}
    if (typeof body.bar_name      === 'string' && body.bar_name.trim()) updates.name          = body.bar_name.trim()
    if (typeof body.address       === 'string')                          updates.address       = body.address.trim()
    if (typeof body.contact_email === 'string')                          updates.contact_email = body.contact_email.trim()
    if (typeof body.phone         === 'string')                          updates.phone         = body.phone.trim()
    if (typeof body.bar_type      === 'string')                          updates.bar_type      = body.bar_type.trim()

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', businessId)

      if (error) throw error
    }

    // Mark onboarding complete once bar name is set (owner flow only)
    if (ctx.isOwner && !user.user_metadata?.onboarding_complete && updates.name) {
      await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata ?? {}), onboarding_complete: true },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
