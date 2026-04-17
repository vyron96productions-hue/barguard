import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  let name: string, company: string, email: string, phone: string | undefined, client_count: string | undefined, message: string | undefined
  try {
    ;({ name, company, email, phone, client_count, message } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!name?.trim() || !company?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name, company, and email are required.' }, { status: 400 })
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="background: #020817; padding: 24px 28px; border-radius: 12px 12px 0 0; border-bottom: 2px solid #f59e0b;">
        <p style="color: #f59e0b; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 4px;">BarGuard Partner Interest</p>
        <p style="color: #f8fafc; font-size: 18px; font-weight: 700; margin: 0;">${name} — ${company}</p>
      </div>
      <div style="background: #f8fafc; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px; vertical-align: top;">Name</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Company</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #f59e0b; font-size: 14px;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Phone</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${phone || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; vertical-align: top;">Est. Clients</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${client_count || '—'}</td>
          </tr>
        </table>
        ${message ? `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px;">Additional Info</p>
          <p style="color: #1e293b; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
        ` : ''}
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">Sent from barguard.app/partners</p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: 'BarGuard <support@barguard.app>',
    to: 'support@barguard.app',
    replyTo: email,
    subject: `[Partner Interest] ${name} — ${company} (${client_count || '?'} clients)`,
    html,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
