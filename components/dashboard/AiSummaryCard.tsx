'use client'

import ReactMarkdown from 'react-markdown'
import type { AiSummary } from '@/types'

function safeFormatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

function safeFormatPeriod(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

interface Props {
  summary: AiSummary
}

export default function AiSummaryCard({ summary }: Props) {
  return (
    <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-slate-900/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 text-sm">◈</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-amber-400">AI Operational Summary</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {safeFormatPeriod(summary.period_start)} — {safeFormatPeriod(summary.period_end)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-600">Generated</p>
          <p className="text-[10px] text-slate-500">{safeFormatDate(summary.created_at)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <div className="prose prose-invert prose-sm max-w-none
          prose-headings:text-amber-400 prose-headings:font-semibold prose-headings:text-sm prose-headings:mt-4 prose-headings:mb-2
          prose-p:text-slate-300 prose-p:leading-7 prose-p:text-sm prose-p:my-2
          prose-strong:text-slate-200 prose-strong:font-semibold
          prose-li:text-slate-300 prose-li:text-sm prose-li:leading-7
          prose-ul:my-2 prose-ol:my-2">
          <ReactMarkdown>{summary.summary_text}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
