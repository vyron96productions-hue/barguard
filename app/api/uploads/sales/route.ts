import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'
import { parseCsvText } from '@/lib/csv'
import { isValidDate, parseFloatSafe } from '@/lib/validation'

// Words to strip before fuzzy matching (pour types, modifiers)
const STRIP = new Set([
  'shot', 'shots', 'neat', 'rocks', 'on', 'the', 'up', 'straight', 'chilled',
  'frozen', 'blended', 'and', 'with', 'service', 'glass', 'pint', 'draft',
  'can', 'bottle', 'double', 'dbl', 'single', 'triple', 'a', 'of', 'cold',
  'premium', 'top', 'shelf', 'house', 'well', 'order', 'special',
])

function nameWords(name: string): string[] {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STRIP.has(w))
}

function fuzzyScore(rawName: string, menuName: string): number {
  const rawWords  = nameWords(rawName)
  const menuWords = nameWords(menuName)
  if (menuWords.length === 0 || rawWords.length === 0) return 0
  const matched = menuWords.filter((w) => rawWords.includes(w)).length
  return matched / menuWords.length
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, businessId } = await getAuthContext()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mappingRaw = formData.get('mapping') as string | null

    if (!file || !mappingRaw) {
      return NextResponse.json({ error: 'file and mapping are required' }, { status: 400 })
    }

    const mapping: Record<string, string> = JSON.parse(mappingRaw)
    const text = await file.text()
    const { rows, errors } = parseCsvText(text)

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: 'CSV parse failed', details: errors }, { status: 400 })
    }

    const validRows: {
      date: string
      item_name: string
      quantity: number
      gross_sales: number | null
      sale_timestamp: string | null
      guest_count: number | null
      check_id: string | null
    }[] = []
    const rowErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const date     = row[mapping.date]
      const itemName = row[mapping.item_name]
      const qtyStr   = row[mapping.quantity_sold]

      if (!date || !isValidDate(date)) { rowErrors.push(`Row ${i + 2}: invalid date "${date}"`); continue }
      if (!itemName) { rowErrors.push(`Row ${i + 2}: missing item_name`); continue }
      const quantity = parseFloatSafe(qtyStr)
      if (quantity === null || quantity < 0) { rowErrors.push(`Row ${i + 2}: invalid quantity "${qtyStr}"`); continue }

      const grossSales     = mapping.gross_sales     ? parseFloatSafe(row[mapping.gross_sales])     : null
      const rawTimestamp   = mapping.sale_timestamp  ? row[mapping.sale_timestamp]                  : null
      const saleTimestamp  = rawTimestamp?.trim() || null
      const rawGuest       = mapping.guest_count     ? parseFloatSafe(row[mapping.guest_count])     : null
      const guestCount     = rawGuest !== null && rawGuest >= 0 ? Math.round(rawGuest) : null
      const checkId        = mapping.check_id && row[mapping.check_id] ? row[mapping.check_id].trim() || null : null

      validRows.push({ date, item_name: itemName, quantity, gross_sales: grossSales, sale_timestamp: saleTimestamp, guest_count: guestCount, check_id: checkId })
    }

    if (validRows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found', details: rowErrors }, { status: 400 })
    }

    const allDates   = validRows.map((r) => r.date).sort()
    const periodStart = allDates[0]
    const periodEnd   = allDates[allDates.length - 1]

    const { data: upload, error: uploadError } = await supabase
      .from('sales_uploads')
      .insert({ business_id: businessId, filename: file.name, period_start: periodStart, period_end: periodEnd, row_count: validRows.length })
      .select()
      .single()

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    // --- Efficient bulk resolution (2 queries instead of N) ---
    const [{ data: menuItems }, { data: menuAliases }] = await Promise.all([
      supabase.from('menu_items').select('id, name').eq('business_id', businessId),
      supabase.from('menu_item_aliases').select('raw_name, menu_item_id').eq('business_id', businessId),
    ])

    const exactByName  = new Map((menuItems  ?? []).map((m) => [m.name.toLowerCase(), m.id]))
    const aliasByName  = new Map((menuAliases ?? []).map((a) => [a.raw_name.toLowerCase(), a.menu_item_id]))

    // Track new fuzzy-matched aliases to save
    const newAliases = new Map<string, string>() // raw_name → menu_item_id

    function resolveId(rawName: string): string | null {
      const lower = rawName.toLowerCase()

      // 1. Saved alias (exact)
      const fromAlias = aliasByName.get(lower)
      if (fromAlias) return fromAlias

      // 2. Exact menu item name match
      const fromExact = exactByName.get(lower)
      if (fromExact) return fromExact

      // 3. Fuzzy match — find best scoring menu item
      let bestScore = 0
      let bestId: string | null = null
      for (const mi of menuItems ?? []) {
        const score = fuzzyScore(rawName, mi.name)
        if (score > bestScore) { bestScore = score; bestId = mi.id }
      }

      if (bestScore >= 0.65 && bestId) {
        // Auto-link and queue alias creation
        newAliases.set(rawName, bestId)
        aliasByName.set(lower, bestId) // prevent duplicate alias creation within same batch
        return bestId
      }

      return null
    }

    const transactions = validRows.map((r) => ({
      upload_id:      upload.id,
      business_id:    businessId,
      sale_date:      r.date,
      raw_item_name:  r.item_name,
      menu_item_id:   resolveId(r.item_name),
      quantity_sold:  r.quantity,
      gross_sales:    r.gross_sales,
      sale_timestamp: r.sale_timestamp,
      guest_count:    r.guest_count,
      check_id:       r.check_id,
    }))

    const { error: txError } = await supabase.from('sales_transactions').insert(transactions)
    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    if (newAliases.size > 0) {
      await supabase.from('menu_item_aliases').upsert(
        Array.from(newAliases.entries()).map(([raw_name, menu_item_id]) => ({
          business_id: businessId,
          raw_name,
          menu_item_id,
        })),
        { onConflict: 'business_id,raw_name' }
      )
    }

    const unresolved = transactions.filter((t) => !t.menu_item_id).map((t) => t.raw_item_name)
    const uniqueUnresolved = [...new Set(unresolved)]

    return NextResponse.json({
      upload_id:          upload.id,
      rows_imported:      validRows.length,
      matched:            transactions.filter((t) => !!t.menu_item_id).length,
      auto_linked:        newAliases.size,
      unresolved_aliases: uniqueUnresolved,
      row_errors:         rowErrors,
    })
  } catch (e) { return authErrorResponse(e) }
}
