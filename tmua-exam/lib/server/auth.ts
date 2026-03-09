import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isWhitelistedAdminEmail } from '@/lib/server/admin'
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  isStrongEnoughPassword,
  normalizeEmail,
  verifyPassword,
} from '@/lib/server/security'

const SESSION_TTL_DAYS = 30

function sessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
}

export async function registerWithPassword(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput)
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email')
  }
  if (!isStrongEnoughPassword(password)) {
    throw new Error('Password must be at least 8 characters')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error('Email already registered')
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      isAdmin: isWhitelistedAdminEmail(email),
    },
  })

  return user
}

export async function loginWithPassword(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput)
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid credentials')
  }
  return user
}

export async function createUserSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = createSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = sessionExpiryDate()

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function destroyUserSession(rawToken: string | null | undefined) {
  if (!rawToken) return
  const tokenHash = hashSessionToken(rawToken)
  await prisma.authSession.deleteMany({ where: { tokenHash } })
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  })
}

export async function getRequestUser(request: NextRequest) {
  const rawToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!rawToken) return null

  const tokenHash = hashSessionToken(rawToken)
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.authSession.delete({ where: { id: session.id } })
    return null
  }

  return session.user
}
