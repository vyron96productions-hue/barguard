/**
 * Tests for the email ingest staging + template detection pipeline.
 *
 * These are unit tests for the pure/near-pure functions.
 * DB-touching functions (insertIngestMessage, stageAttachment) require
 * a Supabase test instance and are marked as integration tests.
 *
 * Run with: npx jest lib/__tests__/email-ingest.staging.test.ts
 */

import { detectTemplate } from '../email-ingest/templates'
import { normalizeRows } from '../email-ingest/normalize'

// ── detectTemplate ────────────────────────────────────────────────────────────

describe('detectTemplate', () => {
  it('resolves canonical BarGuard headers exactly', () => {
    const mapping = detectTemplate(['date', 'item_name', 'quantity_sold'])
    expect(mapping).not.toBeNull()
    expect(mapping!.date).toBe('date')
    expect(mapping!.item_name).toBe('item_name')
    expect(mapping!.quantity_sold).toBe('quantity_sold')
  })

  it('resolves header aliases', () => {
    const mapping = detectTemplate(['sale_date', 'product_name', 'qty', 'gross'])
    expect(mapping).not.toBeNull()
    expect(mapping!.date).toBe('sale_date')
    expect(mapping!.item_name).toBe('product_name')
    expect(mapping!.quantity_sold).toBe('qty')
    expect(mapping!.gross_sales).toBe('gross')
  })

  it('returns null when required field date is missing', () => {
    const mapping = detectTemplate(['item_name', 'quantity_sold'])
    expect(mapping).toBeNull()
  })

  it('returns null when required field quantity_sold is missing', () => {
    const mapping = detectTemplate(['date', 'item_name'])
    expect(mapping).toBeNull()
  })

  it('returns null for completely unsupported headers', () => {
    const mapping = detectTemplate(['foo', 'bar', 'baz'])
    expect(mapping).toBeNull()
  })

  it('maps optional fields when present', () => {
    const mapping = detectTemplate(['date', 'item_name', 'quantity_sold', 'covers', 'ticket_id'])
    expect(mapping).not.toBeNull()
    expect(mapping!.guest_count).toBe('covers')
    expect(mapping!.check_id).toBe('ticket_id')
  })
})

// ── normalizeRows ─────────────────────────────────────────────────────────────

describe('normalizeRows', () => {
  const mapping = {
    date:          'date',
    item_name:     'item_name',
    quantity_sold: 'quantity_sold',
  }

  it('parses a valid ISO date row', () => {
    const { validRows, rowErrors } = normalizeRows(
      [{ date: '2024-03-01', item_name: 'Vodka Soda', quantity_sold: '5' }],
      mapping,
    )
    expect(rowErrors).toHaveLength(0)
    expect(validRows).toHaveLength(1)
    expect(validRows[0].date).toBe('2024-03-01')
    expect(validRows[0].quantity).toBe(5)
  })

  it('parses a US date format (MM/DD/YYYY)', () => {
    const { validRows, rowErrors } = normalizeRows(
      [{ date: '03/01/2024', item_name: 'Vodka Soda', quantity_sold: '5' }],
      mapping,
    )
    expect(rowErrors).toHaveLength(0)
    expect(validRows[0].date).toBe('2024-03-01')
  })

  it('parses a short US date format (M/D/YY)', () => {
    const { validRows } = normalizeRows(
      [{ date: '3/1/24', item_name: 'Vodka Soda', quantity_sold: '5' }],
      mapping,
    )
    expect(validRows[0].date).toBe('2024-03-01')
  })

  it('records error for unrecognized date format', () => {
    const { validRows, rowErrors } = normalizeRows(
      [{ date: 'not-a-date', item_name: 'Vodka Soda', quantity_sold: '5' }],
      mapping,
    )
    expect(validRows).toHaveLength(0)
    expect(rowErrors[0].message).toMatch(/unrecognized date format/)
  })

  it('records error for missing item_name', () => {
    const { validRows, rowErrors } = normalizeRows(
      [{ date: '2024-03-01', item_name: '', quantity_sold: '5' }],
      mapping,
    )
    expect(validRows).toHaveLength(0)
    expect(rowErrors[0].message).toMatch(/missing item_name/)
  })

  it('records error for negative quantity', () => {
    const { validRows, rowErrors } = normalizeRows(
      [{ date: '2024-03-01', item_name: 'Vodka Soda', quantity_sold: '-1' }],
      mapping,
    )
    expect(validRows).toHaveLength(0)
    expect(rowErrors[0].message).toMatch(/invalid quantity/)
  })

  it('accepts zero quantity', () => {
    const { validRows } = normalizeRows(
      [{ date: '2024-03-01', item_name: 'Vodka Soda', quantity_sold: '0' }],
      mapping,
    )
    expect(validRows[0].quantity).toBe(0)
  })

  it('coerces guest_count to integer', () => {
    const { validRows } = normalizeRows(
      [{ date: '2024-03-01', item_name: 'Vodka Soda', quantity_sold: '2', covers: '3.7' }],
      { ...mapping, guest_count: 'covers' },
    )
    expect(validRows[0].guest_count).toBe(4)
  })

  it('sets guest_count to null for negative value', () => {
    const { validRows } = normalizeRows(
      [{ date: '2024-03-01', item_name: 'Vodka Soda', quantity_sold: '2', covers: '-1' }],
      { ...mapping, guest_count: 'covers' },
    )
    expect(validRows[0].guest_count).toBeNull()
  })

  it('trims string fields', () => {
    const { validRows } = normalizeRows(
      [{ date: '2024-03-01', item_name: '  Vodka Soda  ', quantity_sold: '2', station: '  Bar 1  ' }],
      { ...mapping, station: 'station' },
    )
    expect(validRows[0].item_name).toBe('Vodka Soda')
    expect(validRows[0].station).toBe('Bar 1')
  })

  it('mixes valid and invalid rows correctly', () => {
    const rows = [
      { date: '2024-03-01', item_name: 'Vodka Soda', quantity_sold: '5' },
      { date: 'bad-date',   item_name: 'Beer',        quantity_sold: '2' },
      { date: '2024-03-02', item_name: 'Margarita',  quantity_sold: '3' },
    ]
    const { validRows, rowErrors } = normalizeRows(rows, mapping)
    expect(validRows).toHaveLength(2)
    expect(rowErrors).toHaveLength(1)
  })

  it('flags truncation when rows exceed 10000', () => {
    const rows = Array.from({ length: 10001 }, (_, i) => ({
      date: '2024-03-01', item_name: `Item ${i}`, quantity_sold: '1',
    }))
    const { validRows, truncated } = normalizeRows(rows, mapping)
    expect(truncated).toBe(true)
    expect(validRows.length).toBeLessThanOrEqual(10000)
  })
})
