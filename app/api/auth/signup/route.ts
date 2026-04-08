import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { randomUUID } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

function usernameToEmail(username: string) {
  const clean = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
  return `${clean}@barguard.app`
}

export async function POST(req: NextRequest) {
  try {
    const { bar_name, username, email, password } = await req.json()

    if (!bar_name || !username || !email || !password) {
      return NextResponse.json({ error: 'bar_name, username, email, and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if email is already in use (covers both email/password and Google signups)
    const { data: existingBiz } = await adminSupabase
      .from('businesses')
      .select('id')
      .eq('contact_email', normalizedEmail)
      .maybeSingle()

    if (existingBiz) {
      // Check if the existing account used Google so we can give a better message
      const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
      const googleUser = users.find(
        (u) => u.email === normalizedEmail && u.app_metadata?.provider === 'google'
      )
      if (googleUser) {
        return NextResponse.json(
          { error: 'This email is linked to a Google account. Sign in with Google instead.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'An account with that email already exists. Try signing in instead.' }, { status: 400 })
    }

    const authEmail = usernameToEmail(username)

    // Create Supabase auth user
    const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { username: username.toLowerCase().trim(), bar_name: bar_name.trim() },
    })

    if (authErr || !authData.user) {
      const msg = authErr?.message?.includes('already been registered')
        ? 'That username is already taken. Choose another.'
        : (authErr?.message ?? 'Failed to create account')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Create business with email_verified = false
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: business, error: bizErr } = await adminSupabase
      .from('businesses')
      .insert({ name: bar_name.trim(), contact_email: normalizedEmail, trial_ends_at: trialEndsAt, email_verified: false })
      .select()
      .single()

    if (bizErr || !business) {
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: bizErr?.message ?? 'Failed to create business' }, { status: 500 })
    }

    // Link user to business
    const { error: linkErr } = await adminSupabase
      .from('user_businesses')
      .insert({ user_id: authData.user.id, business_id: business.id, role: 'owner' })

    if (linkErr) {
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      await adminSupabase.from('businesses').delete().eq('id', business.id)
      return NextResponse.json({ error: linkErr.message }, { status: 500 })
    }

    // Generate verification token and store in app_metadata
    const token = randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await adminSupabase.auth.admin.updateUserById(authData.user.id, {
      app_metadata: {
        email_verified: false,
        email_verification_token: token,
        email_verification_expires: expires,
      },
    })

    // Send verification email
    const origin = req.headers.get('origin') || 'https://barguard.app'
    const verifyUrl = `${origin}/verify-email?uid=${authData.user.id}&token=${token}`
    await resend.emails.send({
      from: 'BarGuard <noreply@barguard.app>',
      to: normalizedEmail,
      subject: 'Verify your BarGuard email',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
            <div style="width:40px;height:40px;background:#f59e0b;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#0f172a">BG</div>
            <span style="font-size:18px;font-weight:bold;color:#f1f5f9">BarGuard</span>
          </div>
          <h2 style="color:#f1f5f9;margin:0 0 8px">Verify your email</h2>
          <p style="color:#94a3b8;margin:0 0 24px">Hi <strong style="color:#e2e8f0">@${username.toLowerCase().trim()}</strong>, click below to verify your email and activate your account.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
            Verify Email
          </a>
          <p style="color:#475569;font-size:12px;margin:24px 0 0">This link expires in 24 hours. If you didn't create a BarGuard account, ignore this email.</p>
        </div>
      `,
    })

    // Sign in so they get a session cookie (but email_verified = false gates the app)
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signInWithPassword({ email: authEmail, password })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
