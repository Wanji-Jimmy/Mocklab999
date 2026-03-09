import { NextRequest } from 'next/server'
import { clearSessionCookie, destroyUserSession } from '@/lib/server/auth'
import { ok } from '@/lib/server/http'
import { SESSION_COOKIE_NAME } from '@/lib/server/security'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  await destroyUserSession(token)

  const response = ok({ success: true })
  clearSessionCookie(response)
  return response
}
