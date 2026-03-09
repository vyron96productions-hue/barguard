import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Convert a username to the internal email format
function usernameToEmail(username: string) {
  const clean = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '')
  return `${clean}@barguard.app`
}

export async function POST(req: NextRequest) {
  try {
    const { bar_name, username, password } = await req.json()

    if (!bar_name || !username || !password) {
      return NextResponse.json({ error: 'bar_name, username, and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }, { status: 400 })
    }

    const email = usernameToEmail(username)

    // 1. Create Supabase auth user
    const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: username.toLowerCase().trim(), bar_name: bar_name.trim() },
    })

    if (authErr || !authData.user) {
      // Give a friendlier message for duplicate username
      const msg = authErr?.message?.includes('already been registered')
        ? 'That username is already taken. Choose another.'
        : (authErr?.message ?? 'Failed to create account')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // 2. Create business
    const { data: business, error: bizErr } = await adminSupabase
      .from('businesses')
      .insert({ name: bar_name.trim() })
      .select()
      .single()

    if (bizErr || !business) {
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: bizErr?.message ?? 'Failed to create business' }, { status: 500 })
    }

    // 3. Link user to business
    const { error: linkErr } = await adminSupabase
      .from('user_businesses')
      .insert({ user_id: authData.user.id, business_id: business.id, role: 'owner' })

    if (linkErr) {
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      await adminSupabase.from('businesses').delete().eq('id', business.id)
      return NextResponse.json({ error: linkErr.message }, { status: 500 })
    }

    // 4. Sign in immediately so they get a session cookie
    const supabase = await createSupabaseServerClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr) {
      return NextResponse.json({ error: 'Account created but sign-in failed. Please log in.' }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
