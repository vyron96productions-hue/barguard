import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { bar_name, email, password } = await req.json()

    if (!bar_name || !email || !password) {
      return NextResponse.json({ error: 'bar_name, email, and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // 1. Create Supabase auth user
    const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authErr || !authData.user) {
      return NextResponse.json({ error: authErr?.message ?? 'Failed to create account' }, { status: 400 })
    }

    // 2. Create business
    const { data: business, error: bizErr } = await adminSupabase
      .from('businesses')
      .insert({ name: bar_name.trim() })
      .select()
      .single()

    if (bizErr || !business) {
      // Cleanup: delete the auth user we just created
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

    // 4. Sign in the user immediately so they get a session cookie
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
