import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)
const ROUTE = 'auth/verify-email'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  if (!uid || !token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification_link`)
  }

  // Fetch user
  const { data: userData, error: userErr } = await adminSupabase.auth.admin.getUserById(uid)
  if (userErr || !userData.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification_link`)
  }

  const meta = userData.user.app_metadata ?? {}
  const storedToken = meta.email_verification_token
  const expires = meta.email_verification_expires

  if (!storedToken || storedToken !== token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_verification_link`)
  }

  if (expires && new Date(expires) < new Date()) {
    return NextResponse.redirect(`${origin}/check-email?expired=1`)
  }

  // Mark business as verified
  const { data: ub } = await adminSupabase
    .from('user_businesses')
    .select('business_id')
    .eq('user_id', uid)
    .single()

  if (ub) {
    await adminSupabase
      .from('businesses')
      .update({ email_verified: true } as never)
      .eq('id', ub.business_id)
  }

  // Update app_metadata — mark verified, clear token
  await adminSupabase.auth.admin.updateUserById(uid, {
    app_metadata: {
      ...meta,
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null,
    },
  })

  // Send welcome email now that the account is confirmed
  try {
    const { data: bizRow } = await adminSupabase
      .from('businesses')
      .select('name, contact_email, trial_ends_at, plan')
      .eq('id', ub?.business_id ?? '')
      .single()

    if (bizRow?.contact_email) {
      const username = userData.user.user_metadata?.username ?? ''
      const barName  = bizRow.name ?? 'Your Bar'
      const trialEnd = bizRow.trial_ends_at
        ? new Date(bizRow.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null
      const isPaid   = bizRow.plan && bizRow.plan !== 'legacy'

      await resend.emails.send({
        from: 'Vyron from BarGuard <vyron@barguard.app>',
        to: bizRow.contact_email,
        subject: isPaid
          ? `Welcome to BarGuard, ${barName}! 🎉`
          : `Your 14-day free trial has started, ${barName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;max-width:560px;width:100%">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 40px;text-align:center">
                      <table cellpadding="0" cellspacing="0" align="center">
                        <tr>
                          <td style="width:44px;height:44px;background:rgba(15,23,42,0.3);border-radius:12px;text-align:center;vertical-align:middle;font-weight:900;font-size:13px;color:#fff;letter-spacing:0.5px">BG</td>
                          <td style="padding-left:12px;font-size:20px;font-weight:700;color:#fff">BarGuard</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px">

                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9">
                        ${isPaid ? `Welcome aboard, ${username ? '@' + username : barName}!` : `Your trial is live, ${username ? '@' + username : barName}!`}
                      </h1>
                      <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.6">
                        ${isPaid
                          ? `You're all set. <strong style="color:#e2e8f0">${barName}</strong> now has full access to BarGuard — inventory tracking, loss detection, POS integrations, and AI-powered insights.`
                          : `You've verified your email and <strong style="color:#e2e8f0">${barName}</strong> is ready to go. Your 14-day free trial gives you full access to everything BarGuard has to offer.`
                        }
                      </p>

                      ${trialEnd && !isPaid ? `
                      <!-- Trial badge -->
                      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px">
                        <tr>
                          <td style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px 20px">
                            <table cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td style="font-size:13px;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">Free Trial Ends</td>
                                <td align="right" style="font-size:14px;font-weight:700;color:#f59e0b">${trialEnd}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      ` : ''}

                      <!-- What's included -->
                      <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">What's included</p>
                      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px">
                        ${[
                          ['📦', 'Inventory Tracking', 'Track every bottle, keg, and ingredient with precision.'],
                          ['📊', 'Variance Reports', 'Spot over-pouring, theft, and waste before they cost you.'],
                          ['🤖', 'AI Insights', 'Get plain-English operational summaries powered by Claude.'],
                          ['🔗', 'POS Integration', 'Connect Square, Clover, Toast, and more in minutes.'],
                          ['💰', 'Profit Intelligence', 'See exactly which drinks make you the most money.'],
                        ].map(([icon, title, desc]) => `
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #1e293b;vertical-align:top;width:28px;font-size:18px">${icon}</td>
                          <td style="padding:10px 12px;border-bottom:1px solid #1e293b;vertical-align:top">
                            <div style="font-size:14px;font-weight:600;color:#e2e8f0">${title}</div>
                            <div style="font-size:13px;color:#64748b;margin-top:2px">${desc}</div>
                          </td>
                        </tr>`).join('')}
                      </table>

                      <!-- CTA -->
                      <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://barguard.app/dashboard"
                               style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none">
                              Go to Your Dashboard →
                            </a>
                          </td>
                        </tr>
                      </table>

                      ${!isPaid ? `
                      <p style="margin:28px 0 0;font-size:13px;color:#475569;text-align:center">
                        After your trial, plans start at <strong style="color:#94a3b8">$99/month</strong>.
                        No credit card required during the trial.
                      </p>` : ''}

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #0f172a;text-align:center">
                      <p style="margin:0;font-size:12px;color:#334155">
                        BarGuard · Made for bars, by people who get it.<br>
                        Questions? Reply to this email — I read everything.
                      </p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      })
    }
    // Internal notification to platform owner
    const ownerEmail = process.env.PLATFORM_OWNER_EMAIL
    if (ownerEmail && bizRow) {
      const username = userData.user.user_metadata?.username ?? '(no username)'
      const barName  = bizRow.name ?? '(no bar name)'
      const trialEnd = bizRow.trial_ends_at
        ? new Date(bizRow.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'N/A'
      const signupTime = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

      await resend.emails.send({
        from: 'BarGuard Signups <noreply@barguard.app>',
        to: ownerEmail,
        subject: `🆕 New signup: ${barName} (@${username})`,
        html: `
          <div style="font-family:monospace;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:12px;max-width:480px">
            <div style="font-size:16px;font-weight:700;color:#f59e0b;margin-bottom:16px">New BarGuard Signup</div>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="color:#64748b;padding:4px 0;width:120px">Bar</td><td style="color:#f1f5f9;font-weight:600">${barName}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0">Username</td><td style="color:#f1f5f9">@${username}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0">Email</td><td style="color:#f1f5f9">${bizRow.contact_email}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0">Trial ends</td><td style="color:#f59e0b">${trialEnd}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0">Signed up</td><td style="color:#94a3b8">${signupTime}</td></tr>
            </table>
          </div>
        `,
      }).catch((err) => { logger.warn(ROUTE, 'Owner notification email failed', { error: err instanceof Error ? err.message : String(err) }) })
    }
  } catch (err) {
    // Welcome email failure is non-fatal — user is already verified, but log for observability
    logger.warn(ROUTE, 'Welcome email failed', { error: err instanceof Error ? err.message : String(err) })
  }

  return NextResponse.redirect(`${origin}/welcome`)
}
