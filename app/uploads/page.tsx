'use client'

import { useState } from 'react'
import CsvUploader from '@/components/CsvUploader'
import type { CsvUploadType } from '@/types'

const tabs: { id: CsvUploadType; label: string; description: string }[] = [
  { id: 'sales', label: 'Sales', description: 'Upload your POS sales export. Requires date, item name, and quantity sold.' },
  { id: 'inventory', label: 'Inventory Count', description: 'Upload your physical inventory count. Requires count date, item name, and quantity on hand.' },
  { id: 'purchases', label: 'Purchases', description: 'Upload your purchase/receiving log. Requires purchase date, item name, and quantity purchased.' },
]

export default function UploadsPage() {
  const [activeTab, setActiveTab] = useState<CsvUploadType>('sales')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [unresolvedAliases, setUnresolvedAliases] = useState<string[]>([])

  function handleSuccess(result: { rows_imported: number; unresolved_aliases: string[] }) {
    setSuccessMsg(`✓ ${result.rows_imported} rows imported successfully`)
    setUnresolvedAliases(result.unresolved_aliases)
  }

  const activeTabInfo = tabs.find((t) => t.id === activeTab)!

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Upload Data</h1>
        <p className="text-gray-500 mt-1 text-sm">Upload your sales, inventory, and purchase reports in CSV format.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSuccessMsg(null); setUnresolvedAliases([]) }}
            className={`flex-1 py-2.5 px-2 rounded text-xs sm:text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
        <p className="text-sm text-gray-400">{activeTabInfo.description}</p>
        <CsvUploader key={activeTab} type={activeTab} onSuccess={handleSuccess} />

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 text-sm">{successMsg}</p>
            {unresolvedAliases.length > 0 && (
              <div className="mt-2">
                <p className="text-yellow-400 text-sm">{unresolvedAliases.length} item name(s) could not be matched:</p>
                <ul className="mt-1 text-xs text-gray-400 list-disc list-inside">
                  {unresolvedAliases.map((name) => <li key={name}>{name}</li>)}
                </ul>
                <p className="text-xs text-gray-500 mt-2">Go to Name Matching to map these names.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sample CSV hints */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Sample format for {activeTabInfo.label}</h3>
        <SampleCsv type={activeTab} />
      </div>
    </div>
  )
}

function SampleCsv({ type }: { type: CsvUploadType }) {
  const samples: Record<CsvUploadType, string> = {
    sales: 'date,item_name,quantity_sold,gross_sales\n2024-03-01,Vodka Soda,12,84.00\n2024-03-01,Margarita,8,64.00',
    inventory: 'count_date,item_name,quantity_on_hand,unit_type\n2024-03-01,Tito\'s Vodka,48.5,oz\n2024-03-01,Bacardi White Rum,32,oz',
    purchases: 'purchase_date,item_name,quantity_purchased,vendor_name,unit_cost\n2024-03-05,Tito\'s Vodka,1,Southern Glazer\'s,22.50',
  }
  return (
    <div className="overflow-x-auto">
      <pre className="text-xs text-gray-500 bg-gray-950 rounded p-3">{samples[type]}</pre>
    </div>
  )
}
