import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { adminSupabase } from '@/lib/supabase/admin'
import { PRICE_IDS } from '@/lib/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { supabase, user, businessId } = await getAuthContext()
    const { plan, billing } = await req.json()

    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: biz } = await supabase
      .from('businesses')
      .select('name, contact_email, stripe_customer_id')
      .eq('id', businessId)
      .single()

    let customerId = biz?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: biz?.contact_email || user.email || undefined,
        name: biz?.name || undefined,
        metadata: { business_id: businessId, user_id: user.id },
      })
      customerId = customer.id
      await adminSupabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', businessId)
    }

    const origin = req.headers.get('origin') || 'https://barguard.app'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile?upgraded=1&plan=${plan}&billing=${billing ?? 'monthly'}`,
      cancel_url: `${origin}/profile`,
      metadata: { business_id: businessId },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return authErrorResponse(e)
  }
}
