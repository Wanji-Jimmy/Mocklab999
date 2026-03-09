import { normalizeEmail } from '@/lib/server/security'

const DEFAULT_ADMIN_WHITELIST = (process.env.ADMIN_EMAIL_WHITELIST || '')
  .split(',')
  .map((entry) => normalizeEmail(entry))
  .filter(Boolean)

export function isWhitelistedAdminEmail(email: string): boolean {
  return DEFAULT_ADMIN_WHITELIST.includes(normalizeEmail(email))
}
