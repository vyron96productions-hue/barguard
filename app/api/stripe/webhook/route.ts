import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminSupabase } from '@/lib/supabase/admin'
import { PRICE_IDS } from '@/lib/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function getPlanFromPriceId(priceId: string) {
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return plan
  }
  return null
}

export async function POST(req: NextRequest) {
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const businessId = session.metadata?.business_id
    if (!businessId || !session.subscription) return NextResponse.json({ ok: true })

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0]?.price.id
    const plan = getPlanFromPriceId(priceId)

    if (plan) {
      await adminSupabase
        .from('businesses')
        .update({ plan, stripe_subscription_id: subscription.id })
        .eq('id', businessId)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const priceId = subscription.items.data[0]?.price.id
    const plan = getPlanFromPriceId(priceId)

    if (plan) {
      await adminSupabase
        .from('businesses')
        .update({ plan })
        .eq('stripe_subscription_id', subscription.id)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await adminSupabase
      .from('businesses')
      .update({ plan: 'basic', stripe_subscription_id: null })
      .eq('stripe_subscription_id', subscription.id)
  }

  return NextResponse.json({ ok: true })
}
