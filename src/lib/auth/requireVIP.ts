import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface StatusError extends Error { status?: number }

/**
 * Verify user has VIP community access.
 * Checks user.vip flag OR an active VIPMembership.
 */
export async function requireVIP() {
  const session = await auth()

  if (!session?.user?.id) {
    const err: StatusError = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  // Fast path: vip flag on session token
  if (session.user.vip) {
    return session
  }

  // Fallback: check for an active membership in DB
  const membership = await prisma.vIPMembership.findFirst({
    where: { userId: session.user.id, status: 'active' },
    select: { id: true },
  })

  if (membership) {
    return session
  }

  const err: StatusError = new Error('Community access requires VIP membership.')
  err.status = 403
  throw err
}
