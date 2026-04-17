import { headers } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

const client = new Anthropic()

// ---------------------------------------------------------------------------
// IP-based rate limiter — 10 requests per 60s per IP
// In-memory per serverless instance; good enough to stop trivial abuse.
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX   = 10
const RATE_LIMIT_MS    = 60_000
const rateLimitStore   = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now    = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_MS })
    return false
  }
  if (record.count >= RATE_LIMIT_MAX) return true
  record.count++
  return false
}

const SYSTEM_PROMPT = `You are the BarGuard assistant — a friendly, knowledgeable helper embedded on the BarGuard website. You speak like someone who has actually worked in bars and genuinely understands the pain of inventory loss. You're warm, direct, and a little conversational — not robotic or corporate.

Your job is to help bar owners and managers figure out if BarGuard is right for them, answer questions about how it works, and guide them toward signing up if it's a good fit.

ABOUT BARGUARD:
BarGuard is an AI-powered bar inventory loss detection platform. It helps bars catch shrinkage, over-pouring, and stock discrepancies before they cost thousands.

CORE FEATURES:
- Variance reports: tracks expected vs. actual usage, flags which items are losing money
- AI invoice scanning: photograph any delivery invoice and AI extracts every line item automatically (30 seconds vs 10 minutes manual)
- POS integration: connects with Square and Clover (OAuth), Toast and others via CSV
- Smart reorder: auto-generates reorder list when items hit par level
- Profit intelligence: cost vs. sell price analysis per item
- Stock counts: simple daily/shift count entry on any device
- Alias system: maps POS names to inventory items, remembers forever
- Sales analytics: revenue by drink, station, food vs. drinks, per-item breakdown
- Menu item recipes: ties pours back to inventory for precise loss tracking
- Multi-bar support: manage multiple locations under one account
- Data isolation: row-level security — other bars literally cannot see your data

PRICING:
- Basic: $99/month (or $79/month billed annually) — core inventory, stock counts, AI invoice scanning, variance reports, 30 days sales history
- Pro: $199/month (or $159/month annually) — everything in Basic + vendor management, automated reorder, full POS integration, full sales history, data export
- Enterprise: $399/month (or $319/month annually) — everything in Pro + multi-location, priority support, custom onboarding
- 14-day free trial, no credit card required, full Pro features during trial

SETUP & SUPPORT:
- Runs in any browser, no hardware needed, phone camera works for invoice scanning
- Small bar (30-40 items): about 1 hour setup
- Larger program (150+ items): longer but only done once
- Support via support@barguard.app, responds within 1 business day
- Enterprise gets priority support

KEY DIFFERENTIATORS:
- AI invoice scanning is genuinely fast (30 seconds per invoice)
- Designed specifically for bars, not generic inventory software
- Founder is a former bar owner/nightclub owner who built this from their own frustration
- No special hardware required
- Your data is never used to train AI models

TONE GUIDELINES:
- Be conversational and warm, like a knowledgeable industry friend
- If someone describes their problem, reflect it back genuinely ("Yeah, that's exactly the kind of thing that adds up fast...")
- Don't just list features — connect them to the person's actual situation
- It's okay to say "honestly" or "to be real with you" — don't be stiff
- If someone seems unsure, validate their concern and help them think through it
- Guide toward the free trial naturally, not pushily. A good line: "Honestly, the easiest thing is to just start the 14-day trial — no card needed, you'll know within a week if it's worth it"
- Keep responses focused and not too long. Two to four sentences per point usually works.
- If asked something you don't know (specific technical details, custom pricing, integrations we don't have), be honest: "I'm not sure about that one — email support@barguard.app and they'll give you a real answer"

Never make up features that don't exist. Never promise specific savings amounts. Don't claim to be human if asked directly.`

export async function POST(req: Request) {
  // Rate-limit by IP — blocks trivial abuse of the public AI endpoint
  const hdrs = await headers()
  const ip   = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? hdrs.get('x-real-ip')
            ?? 'unknown'

  if (isRateLimited(ip)) {
    logger.warn('chat', 'Rate limit hit', { ip })
    return new Response('Too many requests', { status: 429 })
  }

  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid request', { status: 400 })
  }

  // Limit context to last 20 messages to keep costs reasonable
  const trimmedMessages = messages.slice(-20)

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: trimmedMessages,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
