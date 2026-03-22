import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { authErrorResponse } from '@/lib/auth'

// POST /api/admin/partners/[id]/create-login
// Creates a Supabase auth user for a partner and sends them a password reset email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { adminSupabase } = await getAdminContext()
    const { id } = await params
    const { email } = await req.json()

    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    // Get partner record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partner, error: partnerErr } = await (adminSupabase as any)
      .from('partners')
      .select('id, name, email')
      .eq('id', id)
      .single()

    if (partnerErr || !partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

    // Check if a login already exists for this partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingLink } = await (adminSupabase as any)
      .from('partner_users')
      .select('user_id')
      .eq('partner_id', id)
      .single()

    if (existingLink) {
      // Just send a password reset email to the existing user
      const { data: authUser } = await adminSupabase.auth.admin.getUserById(existingLink.user_id)
      if (authUser?.user) {
        const { error: resetErr } = await adminSupabase.auth.admin.generateLink({
          type: 'recovery',
          email: authUser.user.email!,
        })
        if (resetErr) return NextResponse.json({ error: resetErr.message }, { status: 500 })
        return NextResponse.json({ ok: true, message: 'Password reset email sent to existing account' })
      }
    }

    // Create the Supabase auth user
    const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      email_confirm: true,
      user_metadata: {
        role: 'partner',
        partner_id: id,
        onboarding_complete: true,
      },
    })

    if (createErr) {
      if (createErr.message?.includes('already registered')) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    // Link partner_users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linkErr } = await (adminSupabase as any)
      .from('partner_users')
      .insert({ partner_id: id, user_id: newUser.user.id })

    if (linkErr) {
      // Clean up user if link fails
      await adminSupabase.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: linkErr.message }, { status: 500 })
    }

    // Send password setup email (recovery link so they can set their password)
    const { error: resetErr } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
    })

    if (resetErr) {
      // Login was created but email failed — still return success
      return NextResponse.json({ ok: true, warning: 'Login created but email could not be sent. Have the partner use forgot password.' })
    }

    return NextResponse.json({ ok: true, message: 'Partner login created and setup email sent' })
  } catch (e) {
    return authErrorResponse(e)
  }
}
