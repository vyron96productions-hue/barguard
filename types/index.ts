export interface Business {
  id: string
  name: string
  created_at: string
}

export interface InventoryItem {
  id: string
  business_id: string
  name: string
  unit: string // oz, ml, bottle, case, keg, etc.
  category: string | null
  pack_size: number | null    // units per package (e.g. 6 for a 6-pack)
  package_type: string | null // label for package format (e.g. '6-pack', 'case', 'keg')
  cost_per_oz: number | null  // cost in USD per oz for profit calculations
  created_at: string
}

// ─── Drink Library ───────────────────────────────────────────────────────────

export interface DrinkLibraryItem {
  id: string
  business_id: string
  name: string
  category: string | null       // e.g. 'cocktail', 'shot', 'beer', 'mocktail'
  glassware: string | null
  garnish: string | null
  instructions: string | null
  notes: string | null
  menu_item_id: string | null   // optional link to operational engine
  created_at: string
  ingredients?: DrinkLibraryIngredient[]
  aliases?: DrinkLibraryAlias[]
}

export interface DrinkLibraryIngredient {
  id: string
  drink_library_id: string
  inventory_item_id: string | null
  ingredient_name: string
  quantity_oz: number
  notes: string | null
  sort_order: number
  inventory_item?: Pick<InventoryItem, 'id' | 'name' | 'unit' | 'cost_per_oz'>
}

export interface DrinkLibraryAlias {
  id: string
  drink_library_id: string
  alias: string
}

// ─── Drink Profit Summaries ──────────────────────────────────────────────────

export interface DrinkProfitSummary {
  id: string
  business_id: string
  menu_item_id: string
  period_start: string
  period_end: string
  shift_label: string | null
  quantity_sold: number
  gross_revenue: number | null
  estimated_cost: number | null
  estimated_profit: number | null
  profit_margin_pct: number | null
  has_full_cost: boolean
  calculated_at: string
  menu_item?: Pick<MenuItem, 'id' | 'name' | 'category'>
}

export interface MenuItem {
  id: string
  business_id: string
  name: string
  category: string | null
  created_at: string
}

export interface MenuItemRecipe {
  id: string
  menu_item_id: string
  inventory_item_id: string
  quantity: number
  unit: string
  menu_item?: MenuItem
  inventory_item?: InventoryItem
}

export interface SalesUpload {
  id: string
  business_id: string
  filename: string
  period_start: string
  period_end: string
  row_count: number
  created_at: string
}

export interface SalesTransaction {
  id: string
  upload_id: string
  business_id: string
  sale_date: string
  raw_item_name: string
  menu_item_id: string | null
  quantity_sold: number
  gross_sales: number | null
  /** Precise transaction timestamp (from POS or time-stamped CSV). Null for date-only CSV imports. */
  sale_timestamp: string | null
  /** Guest / cover count per transaction, when available from POS. Null for CSV imports. */
  guest_count: number | null
  /** POS check or order reference ID, for deduplication. */
  check_id: string | null
}

export interface InventoryCountUpload {
  id: string
  business_id: string
  filename: string
  count_date: string
  row_count: number
  created_at: string
}

export interface InventoryCount {
  id: string
  upload_id: string
  business_id: string
  count_date: string
  raw_item_name: string
  inventory_item_id: string | null
  quantity_on_hand: number
  unit_type: string | null
}

export interface PurchaseUpload {
  id: string
  business_id: string
  filename: string
  period_start: string
  period_end: string
  row_count: number
  created_at: string
}

export interface Purchase {
  id: string
  upload_id: string
  business_id: string
  purchase_date: string
  raw_item_name: string
  inventory_item_id: string | null
  quantity_purchased: number
  vendor_name: string | null
  unit_cost: number | null
  unit_type: string | null
}

export interface InventoryUsageSummary {
  id: string
  business_id: string
  inventory_item_id: string
  period_start: string
  period_end: string
  beginning_inventory: number
  ending_inventory: number
  purchased: number
  actual_usage: number
  expected_usage: number
  variance: number
  variance_percent: number | null
  status: 'normal' | 'warning' | 'critical'
  calculated_at: string
  inventory_item?: InventoryItem
  // ── Shift tracking (nullable; populated when a shift window was specified) ──
  /** ISO 8601 absolute start of the shift window */
  shift_start: string | null
  /** ISO 8601 absolute end of the shift window */
  shift_end: string | null
  /** Human-readable shift label: "Dinner · Mon, Mar 9, 2026 · 5:00 PM – 9:00 PM" */
  shift_label: string | null
  /** Total gross sales revenue for the period/shift */
  total_revenue: number | null
  /** Total guests / covers for the period/shift (exact from POS, or null if unavailable) */
  total_covers: number | null
}

export interface AiSummary {
  id: string
  business_id: string
  period_start: string
  period_end: string
  summary_text: string
  created_at: string
  /** Shift label this summary was generated for, if shift mode was used */
  shift_label: string | null
}

export interface InventoryItemAlias {
  id: string
  business_id: string
  raw_name: string
  inventory_item_id: string
  inventory_item?: InventoryItem
}

export interface MenuItemAlias {
  id: string
  business_id: string
  raw_name: string
  menu_item_id: string
  menu_item?: MenuItem
}

// CSV column mapping types
export interface ColumnMapping {
  [requiredField: string]: string // requiredField -> csvHeader
}

export type VarianceStatus = 'normal' | 'warning' | 'critical'

export type CsvUploadType = 'sales' | 'inventory' | 'purchases'

// ─── Purchase Scan Import ───────────────────────────────────────────────────

export interface DocumentUpload {
  id: string
  business_id: string
  filename: string
  file_type: string
  file_data: string | null      // base64-encoded file content
  raw_extracted_text: string | null
  created_at: string
}

export interface PurchaseImportDraft {
  id: string
  business_id: string
  document_upload_id: string | null
  vendor_name: string | null
  purchase_date: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  confidence: 'high' | 'medium' | 'low'
  warning_message: string | null
  created_at: string
  confirmed_at: string | null
  document_upload?: Pick<DocumentUpload, 'id' | 'filename' | 'file_type'>
}

export interface PurchaseImportDraftLine {
  id: string
  draft_id: string
  raw_item_name: string
  inventory_item_id: string | null
  quantity: number | null
  unit_type: string | null
  unit_cost: number | null
  line_total: number | null
  match_status: 'matched' | 'unmatched' | 'manual'
  confidence: 'high' | 'medium' | 'low'
  is_approved: boolean
  sort_order: number
  package_type: string | null       // e.g. '6-pack', 'case'
  units_per_package: number | null  // individual units per package
  inventory_item?: Pick<InventoryItem, 'id' | 'name' | 'unit' | 'category' | 'pack_size' | 'package_type'>
}

export interface PurchaseImportDraftWithLines extends PurchaseImportDraft {
  lines: PurchaseImportDraftLine[]
  document_upload?: Pick<DocumentUpload, 'id' | 'filename' | 'file_type' | 'file_data' | 'raw_extracted_text'>
}

// Re-export POS types for convenience
export type { PosProvider, PosConnection, PosSyncLog, NormalizedSaleItem } from '@/lib/pos/types'
