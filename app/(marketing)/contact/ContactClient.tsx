'use client'

import { useState } from 'react'

const SUBJECTS = [
  'General Inquiry',
  'Technical Support',
  'Billing & Subscription',
  'Partnership',
  'Other',
]

export default function ContactClient() {
  const [name, setName] = useState('')
  const [barName, setBarName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, barName, email, subject, message }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    setSent(true)
  }

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh' }}>
      <style>{`
        .contact-layout {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 80px;
          align-items: start;
          padding-bottom: 120px;
        }
        .contact-input {
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
        .contact-input::placeholder { color: #475569; }
        .contact-input option { color: #ffffff; background: #0f172a; }
        .contact-input:focus { border-color: rgba(245,158,11,0.5); }
        .contact-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        @media (max-width: 860px) {
          .contact-layout {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '72px 0 64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 28, fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
            Get In Touch
          </div>
          <h1 style={{ fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1, letterSpacing: '-1px', margin: '0 auto 16px', maxWidth: 600 }}>
            We are here to help
          </h1>
          <p style={{ fontSize: 17, color: '#64748b', margin: '0 auto', maxWidth: 480, lineHeight: 1.7 }}>
            Have a question, need support, or want to talk about your bar? Send us a message and we will get back to you within one business day.
          </p>
        </section>

        {/* MAIN */}
        <div className="contact-layout">

          {/* Left — info */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {[
                {
                  icon: '✉',
                  title: 'Email Support',
                  desc: 'For direct inquiries, reach us at',
                  link: 'support@barguard.app',
                  href: 'mailto:support@barguard.app',
                },
                {
                  icon: '⏱',
                  title: 'Response Time',
                  desc: 'We typically respond within one business day. For urgent billing issues, mention it in your subject.',
                  link: null,
                  href: null,
                },
                {
                  icon: '📖',
                  title: 'FAQ',
                  desc: 'Before reaching out, check our FAQ — most common questions are answered there.',
                  link: 'View the FAQ →',
                  href: '/faq',
                },
              ].map((item) => (
                <div key={item.title} style={{ padding: '20px 22px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', margin: '0 0 4px' }}>{item.title}</p>
                      <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                        {item.desc}{' '}
                        {item.link && item.href && (
                          <a href={item.href} data-gtm-event="cta_click" data-gtm-label={item.href.startsWith('mailto') ? 'contact_support_email' : 'contact_faq_link'} style={{ color: '#f59e0b', textDecoration: 'none' }}>{item.link}</a>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Right — form */}
          <div>
            {sent ? (
              <div style={{ padding: '48px 32px', background: '#0f172a', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>✓</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>Message sent</p>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
                  Thanks for reaching out. We will get back to you at <span style={{ color: '#94a3b8' }}>{email}</span> within one business day.
                </p>
                <button
                  onClick={() => { setSent(false); setName(''); setBarName(''); setEmail(''); setSubject(''); setMessage('') }}
                  style={{ fontSize: 13, color: '#f59e0b', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="contact-label">Your name *</label>
                    <input className="contact-input" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" required />
                  </div>
                  <div>
                    <label className="contact-label">Bar name</label>
                    <input className="contact-input" value={barName} onChange={e => setBarName(e.target.value)} placeholder="The Rusty Nail" />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="contact-label">Email address *</label>
                  <input className="contact-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="contact-label">Subject</label>
                  <select
                    className="contact-input"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Select a topic</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="contact-label">Message *</label>
                  <textarea
                    className="contact-input"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what you need help with..."
                    rows={6}
                    required
                    style={{ resize: 'vertical', minHeight: 140 }}
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
                  data-gtm-event="cta_click"
                  data-gtm-label="contact_form_submit"
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
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
