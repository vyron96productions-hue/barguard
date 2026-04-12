import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()

    if (!username) {
      return NextResponse.json({ error: 'Username or email is required' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || 'https://barguard.app'
    const redirectTo = `${origin}/reset-password`

    // ── Branch A: caller provided a real email address ────────────────────
    // Invited members log in with their real email, not a @barguard.app username.
    // Send the recovery link directly to that email.
    if (username.includes('@')) {
      const email = username.toLowerCase().trim()

      const { data, error } = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      })

      if (error || !data?.properties?.action_link || !data?.user) {
        // Don't reveal whether the account exists
        return NextResponse.json({ sent: true })
      }

      await resend.emails.send({
        from:    'BarGuard <noreply@barguard.app>',
        to:      email,   // send to the user's own email, not business contact_email
        subject: 'Reset your BarGuard password',
        html:    buildResetEmail(data.properties.action_link, email.split('@')[0]),
      })

      return NextResponse.json({ sent: true })
    }

    // ── Branch B: caller provided a username (owner flow) ─────────────────
    // Owners log in as username@barguard.app. We look up their business
    // contact_email and send the recovery link there.
    const clean = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
    if (!clean) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
    }

    const barguardEmail = `${clean}@barguard.app`

    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: barguardEmail,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link || !data?.user) {
      return NextResponse.json(
        { error: 'No account found with that username.' },
        { status: 400 }
      )
    }

    // Look up the business contact_email for the owner
    const { data: ub } = await adminSupabase
      .from('user_businesses')
      .select('business_id')
      .eq('user_id', data.user.id)
      .eq('membership_status', 'active')
      .single()

    const { data: biz } = ub
      ? await adminSupabase
          .from('businesses')
          .select('contact_email')
          .eq('id', ub.business_id)
          .single()
      : { data: null }

    if (!biz?.contact_email) {
      return NextResponse.json(
        { error: 'No recovery email on file for this account. Log in and go to Account Settings to add one.' },
        { status: 400 }
      )
    }

    await resend.emails.send({
      from:    'BarGuard <noreply@barguard.app>',
      to:      biz.contact_email,  // owner: send to business contact email
      subject: 'Reset your BarGuard password',
      html:    buildResetEmail(data.properties.action_link, clean),
    })

    return NextResponse.json({ sent: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function buildResetEmail(actionLink: string, displayName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="width:40px;height:40px;background:#f59e0b;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#0f172a">BG</div>
        <span style="font-size:18px;font-weight:bold;color:#f1f5f9">BarGuard</span>
      </div>
      <h2 style="color:#f1f5f9;margin:0 0 8px">Reset your password</h2>
      <p style="color:#94a3b8;margin:0 0 24px">Hi <strong style="color:#e2e8f0">${displayName}</strong>, click the button below to set a new password.</p>
      <a href="${actionLink}"
         style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
        Reset Password
      </a>
      <p style="color:#475569;font-size:12px;margin:24px 0 0">This link expires in 1 hour. If you didn't request a password reset, ignore this email.</p>
    </div>
  `
}
