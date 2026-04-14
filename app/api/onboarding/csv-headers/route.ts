import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { logError } from '@/lib/logger'

const ROUTE = 'onboarding/csv-headers'

export async function POST(req: NextRequest) {
  try {
    await getAuthContext() // auth check only

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

    const text = await file.text()
    const { headers, rows } = parseCsvText(text)

    // Return headers + a sample row so UI can guess the right columns
    const sample = rows[0] ?? null

    return NextResponse.json({ headers, sample, row_count: rows.length })
  } catch (e) {
    logError(ROUTE, e)
    return authErrorResponse(e, ROUTE)
  }
}
