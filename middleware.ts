import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS_EXACT = ['/']
const PUBLIC_PREFIXES = [
  '/login', '/signup', '/forgot-password', '/reset-password', '/check-email', '/verify-email', '/partner-login',
  // accept-invite is public so unauthenticated users can land directly from email link
  '/accept-invite',
  '/api/auth/', '/api/webhooks/', '/api/stripe/webhook',
  '/api/pos/square/callback', '/api/pos/clover/callback', '/api/pos/lightspeed/callback',
  '/pricing', '/privacy', '/terms', '/refund', '/features', '/faq', '/about', '/contact', '/api/contact',
  '/how-it-works', '/partners', '/api/chat', '/api/partner/interest', '/status', '/api/status',
  '/blog', '/sitemap.xml', '/robots.txt',
  '/api/email-imports/poll', '/api/email-imports/cleanup',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS_EXACT.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Partner gate — partner users only access /partner/* routes ──────────────
  const isPartner = user.user_metadata?.role === 'partner'
  const isPartnerPath = pathname.startsWith('/partner') || pathname.startsWith('/api/partner/')
  if (isPartner) {
    if (isPartnerPath) return response
    const isApiPath = pathname.startsWith('/api/')
    if (isApiPath) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.redirect(new URL('/partner/dashboard', request.url))
  }

  // ── Email verification gate ────────────────────────────────────────────────
  const emailVerified = user.app_metadata?.email_verified !== false
  if (!emailVerified) {
    return NextResponse.redirect(new URL('/check-email', request.url))
  }

  // ── Onboarding gate ────────────────────────────────────────────────────────
  // Invited members have onboarding_complete set at invite acceptance time,
  // so they bypass this redirect. Only genuine new owners hit it.
  const onboardingComplete = user.user_metadata?.onboarding_complete === true
  const isProfilePath  = pathname.startsWith('/profile')  || pathname.startsWith('/api/profile')
  const isPricingPath  = pathname.startsWith('/pricing')
  const isWelcomePath  = pathname.startsWith('/welcome')

  if (!onboardingComplete && !isProfilePath && !isPricingPath && !isWelcomePath) {
    return NextResponse.redirect(new URL('/profile?new=1', request.url))
  }

  // ── Subscription / trial access gate ──────────────────────────────────────
  const isApiPath   = pathname.startsWith('/api/')
  const isAdminPath = pathname.startsWith('/admin')
  const isAppPage   = !isApiPath && !isProfilePath && !isPricingPath && !isAdminPath && !isWelcomePath

  if (isAppPage) {
    const ACCESS_CACHE_SECONDS = 300 // 5 min — see note below
    const ACCESS_COOKIE = 'bg_access'

    // Short-circuit: cache hit means we already verified access recently.
    // NOTE: If a member is removed, they retain access for up to ACCESS_CACHE_SECONDS
    // after removal. This is an acceptable trade-off to avoid a DB round-trip on
    // every page navigation. getAuthContext() (called by every API route) does NOT
    // use a cache and will reject removed members immediately.
    if (request.cookies.get(ACCESS_COOKIE)?.value === user.id) {
      return response
    }

    const { data: ubRow } = await supabase
      .from('user_businesses')
      .select('role, businesses(plan, trial_ends_at, stripe_subscription_id, payment_grace_ends_at)')
      .eq('user_id', user.id)
      .eq('membership_status', 'active')  // removed members get no valid ubRow here
      .single()

    const biz = (ubRow as any)?.businesses
    const memberRole = (ubRow as any)?.role as string | undefined

    // No active membership found — user was removed or their business was deleted.
    if (!biz) {
      response.cookies.delete(ACCESS_COOKIE)
      return NextResponse.redirect(new URL('/login?error=access_revoked', request.url))
    }

    const now         = new Date()
    const plan        = biz.plan as string | null
    const subId       = biz.stripe_subscription_id as string | null
    const trialEndsAt = biz.trial_ends_at ? new Date(biz.trial_ends_at) : null
    const graceEndsAt = biz.payment_grace_ends_at ? new Date(biz.payment_grace_ends_at) : null

    // ① Legacy plan — always allow.
    if (plan === 'legacy') {
      response.cookies.set(ACCESS_COOKIE, user.id, { maxAge: ACCESS_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/' })
      return response
    }

    // ② Payment grace period expired.
    if (graceEndsAt && graceEndsAt <= now) {
      response.cookies.delete(ACCESS_COOKIE)
      // Non-owner members should not see the owner billing/trial flow.
      const isOwner = memberRole === 'owner'
      const dest = isOwner ? '/pricing?payment_failed=1' : '/pricing?member_locked=1'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // ③ Active paid subscription.
    if (subId) {
      response.cookies.set(ACCESS_COOKIE, user.id, { maxAge: ACCESS_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/' })
      return response
    }

    // ④ No subscription — check trial.
    if (trialEndsAt && trialEndsAt > now) {
      response.cookies.set(ACCESS_COOKIE, user.id, { maxAge: ACCESS_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/' })
      return response
    }

    // ⑤ Trial expired, no subscription, not legacy.
    response.cookies.delete(ACCESS_COOKIE)
    const isOwner = memberRole === 'owner'
    const dest = isOwner ? '/pricing?expired=1' : '/pricing?member_locked=1'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
