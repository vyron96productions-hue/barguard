import { NextResponse } from 'next/server'
import { getPartnerContext } from '@/lib/partner-auth'
import { authErrorResponse } from '@/lib/auth'

const PLAN_MRR: Record<string, number> = { basic: 129, pro: 249, enterprise: 449, legacy: 0 }

// GET /api/partner/dashboard — partner-facing dashboard data
export async function GET() {
  try {
    const { adminSupabase, partner, partnerId } = await getPartnerContext()

    // Fetch all merchants under this partner (use adminSupabase to bypass RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: merchants, error } = await (adminSupabase as any)
      .from('businesses')
      .select('id, name, plan, contact_email, created_at, account_type, stripe_subscription_id')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const merchantList = (merchants ?? []) as Array<{
      id: string
      name: string
      plan: string
      contact_email: string | null
      created_at: string
      account_type: string
      stripe_subscription_id: string | null
    }>

    // Compute summary
    const totalMerchants = merchantList.length
    const activeMerchants = merchantList.filter((m) => PLAN_MRR[m.plan] > 0 || m.plan === 'legacy').length
    const payingMerchants = merchantList.filter((m) => PLAN_MRR[m.plan] > 0).length
    const totalMRR = merchantList.reduce((sum, m) => sum + (PLAN_MRR[m.plan] ?? 0), 0)

    let estimatedPayout = 0
    if (partner.pricing_type === 'rev_share' && partner.revenue_share_pct) {
      estimatedPayout = Math.round((totalMRR * partner.revenue_share_pct) / 100)
    } else if (partner.pricing_type === 'wholesale' && partner.wholesale_price) {
      estimatedPayout = payingMerchants * partner.wholesale_price
    }

    // Derive a simple onboarding status per merchant
    const enrichedMerchants = merchantList.map((m) => ({
      ...m,
      has_subscription: !!m.stripe_subscription_id,
      onboarding_status: m.stripe_subscription_id
        ? 'active'
        : m.plan === 'legacy'
        ? 'trial'
        : 'pending_payment',
    }))

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        partner_code: partner.partner_code,
        status: partner.status,
        pricing_type: partner.pricing_type,
        revenue_share_pct: partner.revenue_share_pct,
        wholesale_price: partner.wholesale_price,
      },
      merchants: enrichedMerchants,
      summary: {
        total_merchants: totalMerchants,
        active_merchants: activeMerchants,
        paying_merchants: payingMerchants,
        total_mrr: totalMRR,
        estimated_payout: estimatedPayout,
      },
    })
  } catch (e) {
    return authErrorResponse(e)
  }
}
