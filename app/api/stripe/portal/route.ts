import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const { data: biz } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('id', businessId)
      .single()

    if (!biz?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || 'https://barguard.app'
    const session = await stripe.billingPortal.sessions.create({
      customer: biz.stripe_customer_id,
      return_url: `${origin}/profile`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return authErrorResponse(e)
  }
}
