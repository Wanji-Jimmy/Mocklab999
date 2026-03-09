import { NextRequest } from 'next/server'
import { getRequestUser } from '@/lib/server/auth'

export async function requireUser(request: NextRequest) {
  const user = await getRequestUser(request)
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request)
  if (!user.isAdmin) {
    throw new Error('FORBIDDEN')
  }
  return user
}
