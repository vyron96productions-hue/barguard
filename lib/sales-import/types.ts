/** A single row that has been parsed and validated from a sales CSV. */
export interface ValidatedSalesRow {
  date: string           // ISO date string e.g. "2024-03-01"
  item_name: string
  quantity: number
  gross_sales: number | null
  sale_timestamp: string | null
  guest_count: number | null
  check_id: string | null
  station: string | null
}

/** Return value of runSalesImport — matches the existing /api/uploads/sales response fields. */
export interface SalesImportResult {
  upload_id: string
  rows_imported: number
  matched: number
  auto_linked: number
  unresolved_aliases: string[]
}
