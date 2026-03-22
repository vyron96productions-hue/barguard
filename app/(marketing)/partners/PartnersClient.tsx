'use client'

import { useState } from 'react'
import Link from 'next/link'

const BENEFITS = [
  {
    icon: '📊',
    title: 'A dashboard built for your clients',
    desc: 'Every bar you onboard gets their own BarGuard account — inventory tracking, sales analysis, loss detection, and AI-powered insights out of the box.',
  },
  {
    icon: '🔗',
    title: 'Your own partner portal',
    desc: 'Log in to your dedicated partner dashboard and see all your client accounts in one place — plan status, active accounts, and onboarding progress.',
  },
  {
    icon: '💼',
    title: 'Flexible partnership structures',
    desc: 'We work with resellers, MSPs, and merchant service providers. Whether you want a revenue share or a wholesale model, we will structure something that works.',
  },
  {
    icon: '⚡',
    title: 'Fast onboarding for your clients',
    desc: 'Accounts are provisioned instantly. Your clients are up and running the same day — no long implementation cycles or IT requirements.',
  },
  {
    icon: '🤝',
    title: 'Dedicated partner support',
    desc: 'You get a direct line to our team. We help you pitch, onboard, and retain your bar clients so you can focus on growing your book of business.',
  },
  {
    icon: '🧠',
    title: 'AI that does the heavy lifting',
    desc: 'BarGuard uses AI to analyze inventory, flag losses, match recipes, and generate purchase insights — making your clients look like they have a full-time analyst on staff.',
  },
]

const WHO = [
  'Merchant Service Providers',
  'POS Resellers & Integrators',
  'Payment Processing Companies',
  'Bar & Restaurant Consultants',
  'Hospitality Technology MSPs',
  'Liquor Distributors & Reps',
]

const CLIENT_RANGES = [
  '1–5 clients',
  '6–20 clients',
  '21–50 clients',
  '51–100 clients',
  '100+ clients',
]

export default function PartnersClient() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [clientCount, setClientCount] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    const res = await fetch('/api/partner/interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company, email, phone, client_count: clientCount, message }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong. Please try again.'); return }
    setSent(true)
  }

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh' }}>
      <style>{`
        .partner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .who-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .p-input {
          width: 100%;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 15px;
          color: #ffffff;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .p-input::placeholder { color: #475569; }
        .p-input:focus { border-color: rgba(245,158,11,0.5); }
        .p-input option { color: #fff; background: #0f172a; }
        .p-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        @media (max-width: 860px) {
          .partner-grid { grid-template-columns: 1fr; gap: 48px; }
          .benefits-grid { grid-template-columns: 1fr; }
          .who-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 540px) {
          .who-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '72px 0 80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 28, fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
            Partner Program
          </div>
          <h1 style={{ fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.08, letterSpacing: '-2px', margin: '0 auto 20px', maxWidth: 780 }}>
            Grow your business.<br />
            <span style={{ color: '#f59e0b' }}>Add BarGuard to your stack.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', margin: '0 auto 40px', maxWidth: 560, lineHeight: 1.7 }}>
            Partner with BarGuard to offer your bar and restaurant clients AI-powered inventory loss detection — and build a new recurring revenue stream in the process.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#apply" style={{ padding: '14px 28px', background: '#f59e0b', color: '#020817', fontWeight: 700, fontSize: 15, borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>
              Apply to Partner
            </a>
            <Link href="/partner-login" style={{ padding: '14px 28px', background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: 15, borderRadius: 10, textDecoration: 'none', border: '1px solid #1e293b', display: 'inline-block' }}>
              Partner Login →
            </Link>
          </div>
        </section>

        {/* WHO THIS IS FOR */}
        <section style={{ marginBottom: 96 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: 20 }}>Who partners with BarGuard</p>
          <div className="who-grid">
            {WHO.map((label) => (
              <div key={label} style={{ padding: '14px 18px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: '#94a3b8' }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-1px' }}>
              Everything you need to resell BarGuard
            </h2>
            <p style={{ fontSize: 16, color: '#475569', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              We handle the product. You handle the relationships.
            </p>
          </div>
          <div className="benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.title} style={{ padding: '24px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16 }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{b.icon}</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>{b.title}</p>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.7 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#f8fafc', margin: '0 0 12px', letterSpacing: '-1px' }}>
              How the program works
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { step: '01', title: 'Apply', desc: 'Fill out the interest form below. We review every application and reach out within two business days.' },
              { step: '02', title: 'Get set up', desc: 'We create your partner account and partner portal login. You get a dedicated BarGuard rep from day one.' },
              { step: '03', title: 'Onboard clients', desc: 'You sell BarGuard to your bar clients. We provision accounts instantly and support your onboarding.' },
              { step: '04', title: 'Earn', desc: 'Depending on your agreement, you earn a revenue share or a margin on every active account you manage.' },
            ].map((item) => (
              <div key={item.step} style={{ padding: '28px 24px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, position: 'relative' }}>
                <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{item.step}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>{item.title}</p>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* APPLY FORM */}
        <section id="apply" style={{ marginBottom: 120 }}>
          <div className="partner-grid">

            {/* Left — info */}
            <div style={{ paddingTop: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#f8fafc', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.1 }}>
                Ready to partner<br />with BarGuard?
              </h2>
              <p style={{ fontSize: 16, color: '#475569', margin: '0 0 36px', lineHeight: 1.7 }}>
                Tell us a bit about your business and how many bar or restaurant clients you work with. We will reach out within two business days to discuss next steps.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'No long contracts', desc: 'Flexible agreements designed around how you do business.' },
                  { label: 'Real support', desc: 'A dedicated point of contact — not a ticket queue.' },
                  { label: 'Proven product', desc: 'BarGuard is already helping bar owners stop losing money every day.' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>✓</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', margin: '0 0 2px' }}>{item.label}</p>
                      <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 40, padding: '20px 24px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14 }}>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 4px' }}>Already a partner?</p>
                <Link href="/partner-login" style={{ fontSize: 14, color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in to your partner portal →
                </Link>
              </div>
            </div>

            {/* Right — form */}
            <div>
              {sent ? (
                <div style={{ padding: '48px 32px', background: '#0f172a', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>✓</div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: '0 0 10px' }}>Application received</p>
                  <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 6px', lineHeight: 1.6 }}>
                    Thanks for your interest, <span style={{ color: '#94a3b8' }}>{name}</span>.
                  </p>
                  <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                    We will be in touch at <span style={{ color: '#94a3b8' }}>{email}</span> within two business days to discuss next steps.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '32px' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 24px' }}>Partner Interest Form</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="p-label">Your name *</label>
                      <input className="p-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
                    </div>
                    <div>
                      <label className="p-label">Company *</label>
                      <input className="p-input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Merchant Services" required />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="p-label">Business email *</label>
                    <input className="p-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="p-label">Phone</label>
                      <input className="p-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
                    </div>
                    <div>
                      <label className="p-label">Est. bar / restaurant clients</label>
                      <select className="p-input" value={clientCount} onChange={e => setClientCount(e.target.value)} style={{ cursor: 'pointer' }}>
                        <option value="">Select range</option>
                        {CLIENT_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="p-label">Tell us about your business</label>
                    <textarea
                      className="p-input"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="What kind of clients do you work with? How do you typically engage with them? Any questions about the program?"
                      rows={4}
                      style={{ resize: 'vertical', minHeight: 110 }}
                    />
                  </div>

                  {error && (
                    <p style={{ fontSize: 13, color: '#f87171', marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: sending ? 'rgba(245,158,11,0.5)' : '#f59e0b',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 10,
                      border: 'none',
                      cursor: sending ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {sending ? 'Submitting…' : 'Submit Application'}
                  </button>

                  <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
                    We review every application personally and respond within 2 business days.
                  </p>
                </form>
              )}
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
