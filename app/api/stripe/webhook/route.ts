import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminSupabase } from '@/lib/supabase/admin'
import { PRICE_IDS } from '@/lib/plans'

const PAYMENT_GRACE_DAYS = 3

function getPlanFromPriceId(priceId: string) {
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return plan
  }
  return null
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
    return NextResponse.json({ ok: true }) // already processed — safe no-op
  }
  if (dedupError) {
    // Non-duplicate error (e.g. 42P01 = table missing, network issue).
    // Log prominently but continue processing — failing a billing event is worse than a rare duplicate.
    console.error(`[stripe] dedup insert failed: code=${dedupError.code} msg=${dedupError.message} event=${event.id}`)
  }

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
      console.log(`[stripe] checkout.completed: business=${businessId} plan=${plan} sub=${subscription.id}`)
    } else {
      console.warn(`[stripe] checkout.completed: unknown priceId=${priceId} business=${businessId}`)
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
      console.log(`[stripe] subscription.updated: sub=${subscription.id} plan=${plan}`)
    } else {
      console.warn(`[stripe] subscription.updated: unknown priceId=${priceId} sub=${subscription.id}`)
    }
  }

  // ── Subscription cancelled/expired → lock the account ─────────────────────
  // Do NOT set plan to 'legacy' — legacy is only granted manually by the platform owner.
  // Set plan to null so the middleware locks them out (trial gate or pricing redirect).
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await adminSupabase
      .from('businesses')
      .update({ plan: null, stripe_subscription_id: null, payment_grace_ends_at: null })
      .eq('stripe_subscription_id', subscription.id)
    console.log(`[stripe] subscription.deleted: sub=${subscription.id} — account locked`)
  }

  // ── Payment failed → open a 3-day grace period ────────────────────────────
  // Only set the grace period on the first failure — don't extend it on Stripe retries.
  if (event.type === 'invoice.payment_failed') {
    // Stripe SDK v20 removed .subscription from Invoice types; it still exists in the runtime payload
    const invoice = event.data.object as Stripe.Invoice & { subscription: string | Stripe.Subscription | null }
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (subscriptionId) {
      const graceEndsAt = new Date(Date.now() + PAYMENT_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()

      // Only write if payment_grace_ends_at is not already set (first failure only)
      await adminSupabase
        .from('businesses')
        .update({ payment_grace_ends_at: graceEndsAt })
        .eq('stripe_subscription_id', subscriptionId)
        .is('payment_grace_ends_at', null) // don't overwrite — first failure sets the clock
      console.log(`[stripe] invoice.payment_failed: sub=${subscriptionId} grace_ends=${graceEndsAt}`)
    }
  }

  // ── Payment succeeded → clear grace period ────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    // Stripe SDK v20 removed .subscription from Invoice types; it still exists in the runtime payload
    const invoice = event.data.object as Stripe.Invoice & { subscription: string | Stripe.Subscription | null }
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (subscriptionId) {
      await adminSupabase
        .from('businesses')
        .update({ payment_grace_ends_at: null })
        .eq('stripe_subscription_id', subscriptionId)
      console.log(`[stripe] invoice.payment_succeeded: sub=${subscriptionId} — grace period cleared`)
    }
  }

  return NextResponse.json({ ok: true })
}
