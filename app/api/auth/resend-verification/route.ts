import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { Resend } from 'resend'
import { randomUUID } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { user, businessId } = await getAuthContext()

    // Get contact_email
    const { data: biz } = await adminSupabase
      .from('businesses')
      .select('contact_email, email_verified')
      .eq('id', businessId)
      .single()

    if (!biz?.contact_email) {
      return NextResponse.json({ error: 'No email on file for this account.' }, { status: 400 })
    }

    if ((biz as any).email_verified === true) {
      return NextResponse.json({ error: 'Email is already verified.' }, { status: 400 })
    }

    const token = randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await adminSupabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        email_verified: false,
        email_verification_token: token,
        email_verification_expires: expires,
      },
    })

    const origin = req.headers.get('origin') || 'https://barguard.app'
    const verifyUrl = `${origin}/verify-email?uid=${user.id}&token=${token}`
    const username = user.user_metadata?.username ?? 'there'

    await resend.emails.send({
      from: 'BarGuard <noreply@barguard.app>',
      to: biz.contact_email,
      subject: 'Verify your BarGuard email',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
            <div style="width:40px;height:40px;background:#f59e0b;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#0f172a">BG</div>
            <span style="font-size:18px;font-weight:bold;color:#f1f5f9">BarGuard</span>
          </div>
          <h2 style="color:#f1f5f9;margin:0 0 8px">Verify your email</h2>
          <p style="color:#94a3b8;margin:0 0 24px">Hi <strong style="color:#e2e8f0">@${username}</strong>, click below to verify your email address.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
            Verify Email
          </a>
          <p style="color:#475569;font-size:12px;margin:24px 0 0">This link expires in 24 hours.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return authErrorResponse(e)
  }
}
