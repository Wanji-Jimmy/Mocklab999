import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'

export const SESSION_COOKIE_NAME = 'tmua_session'
const PASSWORD_KEYLEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, PASSWORD_KEYLEN).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false

  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, salt, PASSWORD_KEYLEN)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export function createSessionToken(): string {
  return randomBytes(48).toString('hex')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase()
}

export function isStrongEnoughPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8
}
