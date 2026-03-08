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
  created_at: string
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
}

export interface AiSummary {
  id: string
  business_id: string
  period_start: string
  period_end: string
  summary_text: string
  created_at: string
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
