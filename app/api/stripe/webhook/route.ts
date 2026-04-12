import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { adminSupabase } from '@/lib/supabase/admin'
import { PRICE_IDS } from '@/lib/plans'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

const ROUTE = 'stripe/webhook'

const PAYMENT_GRACE_DAYS = 3

function getPlanFromPriceId(priceId: string) {
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return plan
  }
  return null
}

async function getBarInfo(subscriptionId: string): Promise<{ name: string; email: string } | null> {
  const { data } = await adminSupabase
    .from('businesses')
    .select('name, contact_email')
    .eq('stripe_subscription_id', subscriptionId)
    .single()
  return data ? { name: data.name ?? 'Unknown bar', email: data.contact_email ?? '' } : null
}

function notifySupport(subject: string, html: string) {
  resend.emails.send({
    from: 'BarGuard <noreply@barguard.app>',
    to: 'support@barguard.app',
    subject,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="width:40px;height:40px;background:#f59e0b;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#0f172a">BG</div>
        <span style="font-size:18px;font-weight:bold;color:#f1f5f9">BarGuard</span>
      </div>
      ${html}
    </div>`,
  }).catch(() => {/* ignore notification failures */})
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Idempotency guard — prevent duplicate processing on Stripe retries ────
  // INSERT wins atomically; any concurrent or retry request gets a 23505 unique
  // violation and returns 200 immediately without doing any work.
  const { error: dedupError } = await adminSupabase
    .from('webhook_idempotency_keys')
    .insert({ provider: 'stripe', event_id: event.id })

  if (dedupError?.code === '23505') {
    logger.info(ROUTE, 'Duplicate event — skipping', { event_id: event.id, type: event.type })
    return NextResponse.json({ ok: true }) // already processed — safe no-op
  }
  if (dedupError) {
    // Non-duplicate error (e.g. 42P01 = table missing, network issue).
    // Log prominently but continue processing — failing a billing event is worse than a rare duplicate.
    logger.error(ROUTE, 'Dedup insert failed — continuing anyway', { event_id: event.id, code: dedupError.code, error: dedupError.message })
  }

  logger.info(ROUTE, 'Processing event', { event_id: event.id, type: event.type })

  // ── Checkout completed → activate paid plan ────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const businessId = session.metadata?.business_id
    if (!businessId || !session.subscription) return NextResponse.json({ ok: true })

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0]?.price?.id
    const plan = getPlanFromPriceId(priceId)

    if (plan) {
      await adminSupabase
        .from('businesses')
        .update({
          plan,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          payment_grace_ends_at: null, // clear any prior payment issue
        })
        .eq('id', businessId)
      logger.info(ROUTE, 'Checkout completed — plan activated', { businessId, plan, subscription_id: subscription.id })
    } else {
      logger.warn(ROUTE, 'Checkout completed — unknown priceId', { businessId, price_id: priceId })
    }
  }

  // ── Subscription updated (plan change, renewal, etc.) ─────────────────────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const priceId = subscription.items.data[0]?.price?.id
    const plan = getPlanFromPriceId(priceId)

    if (plan) {
      await adminSupabase
        .from('businesses')
        .update({ plan })
        .eq('stripe_subscription_id', subscription.id)
      logger.info(ROUTE, 'Subscription updated', { subscription_id: subscription.id, plan })
    } else {
      logger.warn(ROUTE, 'Subscription updated — unknown priceId', { subscription_id: subscription.id, price_id: priceId })
    }
  }

  // ── Subscription cancelled/expired → lock the account ─────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await adminSupabase
      .from('businesses')
      .update({ plan: null, stripe_subscription_id: null, payment_grace_ends_at: null })
      .eq('stripe_subscription_id', subscription.id)
    logger.info(ROUTE, 'Subscription deleted — account locked', { subscription_id: subscription.id })

    const bar = await getBarInfo(subscription.id).catch(() => null)
    notifySupport(
      `Cancellation: ${bar?.name ?? subscription.id}`,
      `<h2 style="color:#f1f5f9;margin:0 0 16px">Subscription cancelled</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="color:#64748b;padding:6px 0;width:120px">Bar</td><td style="color:#e2e8f0;padding:6px 0"><strong>${bar?.name ?? '—'}</strong></td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Email</td><td style="color:#e2e8f0;padding:6px 0">${bar?.email ?? '—'}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Subscription</td><td style="color:#e2e8f0;padding:6px 0">${subscription.id}</td></tr>
        <tr><td style="color:#64748b;padding:6px 0">Time</td><td style="color:#e2e8f0;padding:6px 0">${new Date().toUTCString()}</td></tr>
      </table>`
    )
  }

  // ── Payment failed → open a 3-day grace period ────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice & { subscription: string | Stripe.Subscription | null }
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (subscriptionId) {
      const graceEndsAt = new Date(Date.now() + PAYMENT_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()
      await adminSupabase
        .from('businesses')
        .update({ payment_grace_ends_at: graceEndsAt })
        .eq('stripe_subscription_id', subscriptionId)
        .is('payment_grace_ends_at', null)
      logger.warn(ROUTE, 'Payment failed — grace period opened', { subscription_id: subscriptionId, grace_ends_at: graceEndsAt })

      const bar = await getBarInfo(subscriptionId).catch(() => null)
      notifySupport(
        `Payment failed: ${bar?.name ?? subscriptionId}`,
        `<h2 style="color:#f1f5f9;margin:0 0 16px">Payment failed</h2>
        <p style="color:#94a3b8;margin:0 0 16px">Their card was declined. They have a <strong style="color:#f59e0b">${PAYMENT_GRACE_DAYS}-day grace period</strong> before access is suspended.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#64748b;padding:6px 0;width:120px">Bar</td><td style="color:#e2e8f0;padding:6px 0"><strong>${bar?.name ?? '—'}</strong></td></tr>
          <tr><td style="color:#64748b;padding:6px 0">Email</td><td style="color:#e2e8f0;padding:6px 0">${bar?.email ?? '—'}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0">Subscription</td><td style="color:#e2e8f0;padding:6px 0">${subscriptionId}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0">Grace ends</td><td style="color:#e2e8f0;padding:6px 0">${new Date(graceEndsAt).toUTCString()}</td></tr>
        </table>`
      )
    }
  }

  // ── Payment succeeded → clear grace period ────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice & { subscription: string | Stripe.Subscription | null }
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (subscriptionId) {
      await adminSupabase
        .from('businesses')
        .update({ payment_grace_ends_at: null })
        .eq('stripe_subscription_id', subscriptionId)
      logger.info(ROUTE, 'Payment succeeded — grace period cleared', { subscription_id: subscriptionId })
    }
  }

  return NextResponse.json({ ok: true })
}
