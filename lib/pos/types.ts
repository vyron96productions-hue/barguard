export type PosProvider = 'square' | 'toast' | 'clover' | 'lightspeed' | 'heartland' | 'focus'

export interface PosProviderMeta {
  id: PosProvider
  name: string
  color: string
  description: string
  authType: 'oauth' | 'credentials'
  docsUrl: string
  credentialFields?: { key: string; label: string; placeholder: string; type?: string }[]
  comingSoon?: boolean
}

export const POS_PROVIDERS: PosProviderMeta[] = [
  {
    id: 'square',
    name: 'Square',
    color: '#00B388',
    description: 'Connect your Square POS to automatically sync sales data.',
    authType: 'oauth',
    docsUrl: 'https://developer.squareup.com',
  },
  {
    id: 'toast',
    name: 'Toast',
    color: '#FF4F00',
    description: 'Import sales from your Toast restaurant management system.',
    authType: 'credentials',
    credentialFields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Paste from Toast Web → Integrations → API Access' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: '••••••••', type: 'password' },
      { key: 'restaurantGuid', label: 'Location GUID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    ],
    docsUrl: 'https://doc.toasttab.com/openapi/orders',
  },
  {
    id: 'clover',
    name: 'Clover',
    color: '#62BA46',
    description: 'Sync orders and line items from your Clover merchant account.',
    authType: 'oauth',
    docsUrl: 'https://docs.clover.com',
  },
  {
    id: 'lightspeed',
    name: 'Lightspeed',
    color: '#E84E1B',
    description: 'Pull sales data from Lightspeed Restaurant automatically.',
    authType: 'oauth',
    docsUrl: 'https://developers.lightspeedhq.com',
    comingSoon: true,
  },
  {
    id: 'focus',
    name: 'Focus POS',
    color: '#1B3A6B',
    description: 'Connect your Focus POS system to automatically sync sales data.',
    authType: 'credentials',
    credentialFields: [
      { key: 'venueKey', label: 'Venue Key', placeholder: '7166' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Your Focus POS API key' },
      { key: 'apiSecret', label: 'API Secret', placeholder: '••••••••', type: 'password' },
    ],
    docsUrl: 'https://focuslink.focuspos.com',
    comingSoon: true,
  },
  {
    id: 'heartland',
    name: 'Heartland',
    color: '#E31837',
    description: 'Connect your Heartland Restaurant POS to sync sales data automatically.',
    authType: 'credentials',
    credentialFields: [
      { key: 'subdomain', label: 'Account Subdomain', placeholder: 'yourbiz (from yourbiz.retail.heartland.us)' },
      { key: 'apiKey', label: 'API Key', placeholder: '••••••••••••••••', type: 'password' },
    ],
    docsUrl: 'https://dev.retail.heartland.us',
    comingSoon: true,
  },
]

// Normalized sale item — common format across all POS providers
export interface NormalizedSaleItem {
  sale_date: string           // YYYY-MM-DD
  sale_timestamp?: string | null  // full ISO 8601 UTC timestamp — enables shift time-window filtering
  raw_item_name: string
  quantity_sold: number
  gross_sales: number | null
  station?: string | null  // bartender, register, terminal name, etc.
  modifiers?: string[] | null  // raw modifier names from POS e.g. ["No Bacon", "Extra Shot"]
}

export interface PosTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number   // seconds
  merchant_id?: string
  location_id?: string
  location_name?: string
}

export interface PosConnection {
  id: string
  business_id: string
  pos_type: PosProvider
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  merchant_id: string | null
  location_id: string | null
  location_name: string | null
  connected_at: string
  last_synced_at: string | null
  is_active: boolean
}

export interface PosSyncLog {
  id: string
  business_id: string
  pos_type: PosProvider
  synced_at: string
  period_start: string
  period_end: string
  transactions_imported: number
  status: 'success' | 'error'
  error_message: string | null
}
