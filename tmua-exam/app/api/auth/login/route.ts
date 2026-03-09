import { NextRequest } from 'next/server'
import { createUserSession, loginWithPassword, setSessionCookie } from '@/lib/server/auth'
import { fail, ok } from '@/lib/server/http'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '')
    const password = String(body?.password || '')

    const user = await loginWithPassword(email, password)
    const session = await createUserSession(user.id)

    const response = ok({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    })

    setSessionCookie(response, session.token, session.expiresAt)
    return response
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Login failed', 401)
  }
}
