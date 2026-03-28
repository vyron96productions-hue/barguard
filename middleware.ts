import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS_EXACT = ['/']
const PUBLIC_PREFIXES = [
  '/login', '/signup', '/forgot-password', '/reset-password', '/check-email', '/verify-email', '/partner-login',
  '/api/auth/', '/api/webhooks/', '/api/stripe/webhook',
  '/api/pos/square/callback', '/api/pos/clover/callback', '/api/pos/lightspeed/callback',
  '/pricing', '/privacy', '/terms', '/refund', '/features', '/faq', '/about', '/contact', '/api/contact',
  '/how-it-works', '/partners', '/api/chat', '/api/partner/interest', '/status', '/api/status',
  '/blog', '/sitemap.xml', '/robots.txt',
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
  // app_metadata.email_verified is set server-side — no extra DB query needed.
  // Treat undefined as verified (covers Google OAuth users).
  const emailVerified = user.app_metadata?.email_verified !== false
  if (!emailVerified) {
    return NextResponse.redirect(new URL('/check-email', request.url))
  }

  // ── Onboarding gate ────────────────────────────────────────────────────────
  const onboardingComplete = user.user_metadata?.onboarding_complete === true
  const isProfilePath  = pathname.startsWith('/profile')  || pathname.startsWith('/api/profile')
  const isPricingPath  = pathname.startsWith('/pricing')
  const isWelcomePath  = pathname.startsWith('/welcome')

  if (!onboardingComplete && !isProfilePath && !isPricingPath && !isWelcomePath) {
    return NextResponse.redirect(new URL('/profile?new=1', request.url))
  }

  // ── Subscription / trial access gate ──────────────────────────────────────
  // Only runs for app pages — not API routes, profile, pricing, admin, welcome.
  const isApiPath   = pathname.startsWith('/api/')
  const isAdminPath = pathname.startsWith('/admin')
  const isAppPage   = !isApiPath && !isProfilePath && !isPricingPath && !isAdminPath && !isWelcomePath

  if (isAppPage) {
    // Short-circuit: if the access cookie is present the DB was already checked
    // recently (within ACCESS_CACHE_SECONDS). Skips a Postgres round-trip on every
    // page navigation. Stripe webhooks set plan/grace columns; worst-case lag = cache TTL.
    const ACCESS_CACHE_SECONDS = 300 // 5 minutes
    const ACCESS_COOKIE = 'bg_access'

    if (request.cookies.get(ACCESS_COOKIE)?.value === user.id) {
      return response
    }

    const { data: ubRow } = await supabase
      .from('user_businesses')
      .select('businesses(plan, trial_ends_at, stripe_subscription_id, payment_grace_ends_at)')
      .eq('user_id', user.id)
      .single()

    const biz = (ubRow as any)?.businesses

    if (biz) {
      const now         = new Date()
      const plan        = biz.plan as string | null
      const subId       = biz.stripe_subscription_id as string | null
      const trialEndsAt = biz.trial_ends_at ? new Date(biz.trial_ends_at) : null
      const graceEndsAt = biz.payment_grace_ends_at ? new Date(biz.payment_grace_ends_at) : null

      // ① Legacy plan — Vyron's permanent grant, always allow.
      if (plan === 'legacy') {
        console.log(`[middleware] legacy access: user=${user.id} path=${pathname}`)
        response.cookies.set(ACCESS_COOKIE, user.id, { maxAge: ACCESS_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/' })
        return response
      }

      // ② Payment grace period expired — payment failed > 3 days ago, still unpaid.
      if (graceEndsAt && graceEndsAt <= now) {
        response.cookies.delete(ACCESS_COOKIE)
        return NextResponse.redirect(new URL('/pricing?payment_failed=1', request.url))
      }

      // ③ Active paid subscription (with or without an open grace period).
      if (subId) {
        response.cookies.set(ACCESS_COOKIE, user.id, { maxAge: ACCESS_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/' })
        return response
      }

      // ④ No subscription — check trial.
      if (trialEndsAt && trialEndsAt > now) {
        response.cookies.set(ACCESS_COOKIE, user.id, { maxAge: ACCESS_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/' })
        return response
      }

      // ⑤ Trial expired, no subscription, not legacy → lock out to pricing.
      response.cookies.delete(ACCESS_COOKIE)
      return NextResponse.redirect(new URL('/pricing?expired=1', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
