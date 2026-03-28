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
  }

  // ── Payment failed → open a 3-day grace period ────────────────────────────
  // Only set the grace period on the first failure — don't extend it on Stripe retries.
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
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
    }
  }

  // ── Payment succeeded → clear grace period ────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id

    if (subscriptionId) {
      await adminSupabase
        .from('businesses')
        .update({ payment_grace_ends_at: null })
        .eq('stripe_subscription_id', subscriptionId)
    }
  }

  return NextResponse.json({ ok: true })
}
