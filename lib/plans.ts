export type Plan = 'legacy' | 'basic' | 'pro' | 'enterprise'

export const PRICE_IDS: Record<string, string> = {
  basic: 'price_1TC61SB1YIRqnSkI1hcpGoBP',
  pro: 'price_1TLJxfB1YIRqnSkI7cUPFTiO',
  enterprise: 'price_1TC63DB1YIRqnSkIvxC4eHAu',
}

export const PLAN_ORDER: Plan[] = ['basic', 'pro', 'enterprise', 'legacy']

export function planHasFeature(plan: Plan, requiredPlan: 'basic' | 'pro' | 'enterprise') {
  if (plan === 'legacy') return true
  const current = PLAN_ORDER.indexOf(plan)
  const required = PLAN_ORDER.indexOf(requiredPlan)
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
