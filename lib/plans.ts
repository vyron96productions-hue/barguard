export type Plan = 'legacy' | 'basic' | 'pro' | 'enterprise'

export const PRICE_IDS: Record<string, string> = {
  basic: 'price_1TC61SB1YIRqnSkI1hcpGoBP',
  pro: 'price_1TLJxfB1YIRqnSkI7cUPFTiO',
  enterprise: 'price_1TC63DB1YIRqnSkIvxC4eHAu',
  basic_annual: 'price_1TLKClB1YIRqnSkIloTMe4Sl',
  pro_annual: 'price_1TLKDPB1YIRqnSkIdJnVue2T',
  enterprise_annual: 'price_1TLKDuB1YIRqnSkIhgmyixyr',
}

// Ordered from lowest to highest paid tier. 'legacy' is excluded because
// planHasFeature() grants legacy full access via the early-return above.
const PAID_PLAN_ORDER: Exclude<Plan, 'legacy'>[] = ['basic', 'pro', 'enterprise']

export function planHasFeature(plan: Plan, requiredPlan: 'basic' | 'pro' | 'enterprise') {
  if (plan === 'legacy') return true
  const current = PAID_PLAN_ORDER.indexOf(plan as Exclude<Plan, 'legacy'>)
  const required = PAID_PLAN_ORDER.indexOf(requiredPlan)
  return current >= required
}

export const PLAN_LABELS: Record<Plan, string> = {
  legacy: 'Legacy',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const PLAN_PRICES: Record<Plan, string> = {
  legacy: 'Free',
  basic: '$129/mo',
  pro: '$249/mo',
  enterprise: '$449/mo',
}
