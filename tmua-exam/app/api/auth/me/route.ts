import { NextRequest } from 'next/server'
import { getRequestUser } from '@/lib/server/auth'
import { ok } from '@/lib/server/http'

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request)
  if (!user) {
    return ok({ user: null })
  }

  return ok({
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  })
}
