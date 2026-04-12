/**
 * lib/errors.ts
 * Shared error types with no server-only dependencies.
 * Import from here — not from lib/auth.ts — in any file used by client components.
 */

export class AuthError extends Error {
  constructor(message: string, public status = 401) { super(message) }
}
