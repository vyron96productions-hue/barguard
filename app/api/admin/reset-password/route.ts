import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { authErrorResponse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { adminSupabase } = await getAdminContext()
    const { user_id, contact_email } = await req.json()

    if (!user_id || !contact_email) {
      return NextResponse.json({ error: 'user_id and contact_email required' }, { status: 400 })
    }

    // Get the auth user's email
    const { data: authUser, error: userErr } = await adminSupabase.auth.admin.getUserById(user_id)
    if (userErr || !authUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate a password reset link
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: authUser.user.email!,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barguard.app'}/reset-password` },
    })

    if (error || !data?.properties?.action_link) {
      throw error ?? new Error('Failed to generate reset link')
    }

    // Send via Resend to contact email
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'BarGuard <support@barguard.app>',
      to: contact_email,
      subject: 'Your BarGuard password reset link',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
          <h2 style="color: #f59e0b;">Password Reset</h2>
          <p>A BarGuard admin has generated a password reset link for your account.</p>
          <p style="margin: 24px 0;">
            <a href="${data.properties.action_link}"
               style="background: #f59e0b; color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Reset My Password
            </a>
          </p>
          <p style="color: #64748b; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
