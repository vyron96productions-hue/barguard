import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS_EXACT = ['/']
const PUBLIC_PREFIXES = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/api/auth/', '/api/webhooks/', '/api/stripe/webhook',
  '/pricing', '/privacy', '/terms', '/refund', '/features', '/faq', '/about', '/contact', '/api/contact',
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
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Onboarding gate — redirect to profile if not completed
  const onboardingComplete = user.user_metadata?.onboarding_complete === true
  const isProfilePath = pathname.startsWith('/profile') || pathname.startsWith('/api/profile')
  const isPricingPath = pathname.startsWith('/pricing')
  const isWelcomePath = pathname.startsWith('/welcome')

  if (!onboardingComplete && !isProfilePath && !isPricingPath && !isWelcomePath) {
    return NextResponse.redirect(new URL('/profile?new=1', request.url))
  }

  // Trial expiry gate — only for app pages, not API routes, auth/pricing/admin pages
  const isApiPath = pathname.startsWith('/api/')
  const isAdminPath = pathname.startsWith('/admin')
  const isAppPage = !isApiPath && !isProfilePath && !isPricingPath && !isAdminPath && !isWelcomePath

  if (isAppPage) {
    const { data: ubRow } = await supabase
      .from('user_businesses')
      .select('businesses(plan, trial_ends_at, stripe_subscription_id)')
      .eq('user_id', user.id)
      .single()

    const biz = (ubRow as any)?.businesses
    if (
      biz &&
      biz.plan !== 'legacy' &&
      biz.stripe_subscription_id === null &&
      biz.trial_ends_at &&
      new Date(biz.trial_ends_at) < new Date()
    ) {
      return NextResponse.redirect(new URL('/pricing?expired=1', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
