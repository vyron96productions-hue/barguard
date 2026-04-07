/**
 * Tests for lib/sales-import/service.ts
 *
 * These tests verify that runSalesImport produces the same behavior as
 * the original inline logic in /api/uploads/sales/route.ts.
 *
 * Run with: npx jest lib/__tests__/sales-import.service.test.ts
 * (Requires jest + ts-jest in devDependencies)
 */

import { runSalesImport } from '../sales-import/service'
import type { ValidatedSalesRow } from '../sales-import/types'

// ── Mock Supabase client ──────────────────────────────────────────────────────

function makeMockSupabase(overrides: {
  menuItems?: { id: string; name: string }[]
  menuAliases?: { raw_name: string; menu_item_id: string }[]
  uploadId?: string
  insertError?: string
}) {
  const uploadId = overrides.uploadId ?? 'upload-123'
  const newAliases: { business_id: string; raw_name: string; menu_item_id: string }[] = []

  return {
    _newAliases: newAliases,
    from: (table: string) => ({
      insert: (data: unknown) => {
        if (table === 'sales_uploads') {
          if (overrides.insertError) {
            return { select: () => ({ single: () => ({ data: null, error: { message: overrides.insertError } }) }) }
          }
          return { select: () => ({ single: () => ({ data: { id: uploadId }, error: null }) }) }
        }
        if (table === 'sales_transactions') {
          return { error: null }
        }
        return { error: null }
      },
      upsert: (rows: typeof newAliases) => {
        newAliases.push(...rows)
        return { error: null }
      },
      select: (cols: string) => ({
        eq: (_col: string, _val: string) => {
          if (table === 'menu_items') {
            return { data: overrides.menuItems ?? [], error: null }
          }
          if (table === 'menu_item_aliases') {
            return { data: overrides.menuAliases ?? [], error: null }
          }
          return { data: [], error: null }
        },
      }),
    }),
  }
}

// ── Test data ─────────────────────────────────────────────────────────────────

const baseRow: ValidatedSalesRow = {
  date: '2024-03-01',
  item_name: 'Vodka Soda',
  quantity: 5,
  gross_sales: 35.00,
  sale_timestamp: null,
  guest_count: null,
  check_id: null,
  station: null,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runSalesImport', () => {
  it('returns correct shape matching the original route response', async () => {
    const supabase = makeMockSupabase({ menuItems: [], menuAliases: [] })
    const result = await runSalesImport(
      supabase as unknown as Parameters<typeof runSalesImport>[0],
      'biz-1',
      'sales.csv',
      [baseRow],
    )

    expect(result).toHaveProperty('upload_id')
    expect(result).toHaveProperty('rows_imported', 1)
    expect(result).toHaveProperty('matched', 0)
    expect(result).toHaveProperty('auto_linked', 0)
    expect(result).toHaveProperty('unresolved_aliases')
    expect(Array.isArray(result.unresolved_aliases)).toBe(true)
  })

  it('resolves exact menu item name match', async () => {
    const supabase = makeMockSupabase({
      menuItems: [{ id: 'item-1', name: 'Vodka Soda' }],
      menuAliases: [],
    })
    const result = await runSalesImport(
      supabase as unknown as Parameters<typeof runSalesImport>[0],
      'biz-1',
      'sales.csv',
      [baseRow],
    )
    expect(result.matched).toBe(1)
    expect(result.unresolved_aliases).toHaveLength(0)
  })

  it('resolves saved alias', async () => {
    const supabase = makeMockSupabase({
      menuItems: [{ id: 'item-1', name: 'Vodka Soda' }],
      menuAliases: [{ raw_name: 'vodka soda', menu_item_id: 'item-1' }],
    })
    const result = await runSalesImport(
      supabase as unknown as Parameters<typeof runSalesImport>[0],
      'biz-1',
      'sales.csv',
      [baseRow],
    )
    expect(result.matched).toBe(1)
    expect(result.auto_linked).toBe(0)  // alias already exists, no new alias created
  })

  it('fuzzy-matches at >= 0.65 threshold and creates new alias', async () => {
    const supabase = makeMockSupabase({
      menuItems: [{ id: 'item-1', name: 'Vodka Soda' }],
      menuAliases: [],
    })
    const row: ValidatedSalesRow = { ...baseRow, item_name: 'Vodka Soda Shot' }
    const result = await runSalesImport(
      supabase as unknown as Parameters<typeof runSalesImport>[0],
      'biz-1',
      'sales.csv',
      [row],
    )
    // 'Vodka Soda Shot' vs 'Vodka Soda': menuWords=['vodka','soda'], matched=2/2=1.0 >= 0.65
    expect(result.matched).toBe(1)
    expect(result.auto_linked).toBe(1)
  })

  it('does NOT fuzzy-match below 0.65 threshold', async () => {
    const supabase = makeMockSupabase({
      menuItems: [{ id: 'item-1', name: 'Margarita Classic' }],
      menuAliases: [],
    })
    const row: ValidatedSalesRow = { ...baseRow, item_name: 'Vodka Soda' }
    const result = await runSalesImport(
      supabase as unknown as Parameters<typeof runSalesSupabase>[0],
      'biz-1',
      'sales.csv',
      [row],
    )
    expect(result.matched).toBe(0)
    expect(result.unresolved_aliases).toContain('Vodka Soda')
  })

  it('includes draftId in upload insert when provided', async () => {
    let capturedInsert: Record<string, unknown> | null = null
    const supabase = makeMockSupabase({ menuItems: [], menuAliases: [] })
    const origFrom = supabase.from.bind(supabase)
    supabase.from = (table: string) => {
      const chain = origFrom(table)
      if (table === 'sales_uploads') {
        const origInsert = chain.insert.bind(chain)
        chain.insert = (data: unknown) => {
          capturedInsert = data as Record<string, unknown>
          return origInsert(data)
        }
      }
      return chain
    }

    await runSalesImport(
      supabase as unknown as Parameters<typeof runSalesImport>[0],
      'biz-1',
      'sales.csv',
      [baseRow],
      'draft-abc',
    )
    expect(capturedInsert).not.toBeNull()
    expect(capturedInsert!.email_import_draft_id).toBe('draft-abc')
  })

  it('throws on upload insert error', async () => {
    const supabase = makeMockSupabase({ insertError: 'DB error' })
    await expect(
      runSalesImport(
        supabase as unknown as Parameters<typeof runSalesImport>[0],
        'biz-1',
        'sales.csv',
        [baseRow],
      )
    ).rejects.toThrow('DB error')
  })
})

// Satisfy the linter for the typo above
const runSalesSupabase = runSalesImport
void runSalesSupabase
