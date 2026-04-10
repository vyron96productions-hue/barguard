/**
 * Structured logger for Vercel runtime logs.
 * All output is visible in the Vercel dashboard → Functions → Logs tab.
 * Format: [barguard] LEVEL route | message {context}
 */

type Level = 'info' | 'warn' | 'error'

function log(level: Level, route: string, message: string, ctx?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  const ctxStr = ctx && Object.keys(ctx).length > 0 ? ' ' + JSON.stringify(ctx) : ''
  const line = `[barguard] ${level.toUpperCase()} ${route} | ${message}${ctxStr}`
  if (level === 'error') {
    console.error(`[${ts}]`, line)
  } else if (level === 'warn') {
    console.warn(`[${ts}]`, line)
  } else {
    console.log(`[${ts}]`, line)
  }
}

export const logger = {
  info:  (route: string, message: string, ctx?: Record<string, unknown>) => log('info',  route, message, ctx),
  warn:  (route: string, message: string, ctx?: Record<string, unknown>) => log('warn',  route, message, ctx),
  error: (route: string, message: string, ctx?: Record<string, unknown>) => log('error', route, message, ctx),
}

/** Log an unknown caught error, extracting message + stack */
export function logError(route: string, e: unknown, ctx?: Record<string, unknown>) {
  const message = e instanceof Error ? e.message : String(e)
  const stack   = e instanceof Error ? e.stack?.split('\n').slice(0, 4).join(' | ') : undefined
  logger.error(route, message, { ...ctx, ...(stack ? { stack } : {}) })
}
