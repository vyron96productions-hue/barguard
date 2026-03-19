import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { supabase, user, businessId } = await getAuthContext()

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
      bar_name: biz?.name ?? '',
      address: biz?.address ?? '',
      contact_email: biz?.contact_email ?? '',
      phone: (biz as any)?.phone ?? '',
      bar_type: (biz as any)?.bar_type ?? '',
      plan: biz?.plan ?? 'basic',
      has_subscription: !!biz?.stripe_customer_id,
      trial_ends_at: biz?.trial_ends_at ?? null,
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user, businessId } = await getAuthContext()
    const body = await req.json()

    // Handle username change separately (requires admin API)
    if (typeof body.username === 'string') {
      const newUsername = body.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
      if (!newUsername || !/^[a-z0-9_-]+$/.test(newUsername)) {
        return NextResponse.json({ error: 'Invalid username. Letters, numbers, _ and - only.' }, { status: 400 })
      }

      const newEmail = `${newUsername}@barguard.app`
      const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(user.id, {
        email: newEmail,
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

    // Handle business info updates
    const updates: Record<string, string> = {}
    if (typeof body.bar_name === 'string' && body.bar_name.trim()) {
      updates.name = body.bar_name.trim()
    }
    if (typeof body.address === 'string') {
      updates.address = body.address.trim()
    }
    if (typeof body.contact_email === 'string') {
      updates.contact_email = body.contact_email.trim()
    }
    if (typeof body.phone === 'string') {
      updates.phone = body.phone.trim()
    }
    if (typeof body.bar_type === 'string') {
      updates.bar_type = body.bar_type.trim()
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', businessId)

      if (error) throw error
    }

    // Mark onboarding complete if bar name and phone are set
    if (!user.user_metadata?.onboarding_complete) {
      const finalName = updates.name ?? body.bar_name
      const finalPhone = updates.phone ?? body.phone
      if (finalName) {
        await adminSupabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...(user.user_metadata ?? {}), onboarding_complete: true },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
