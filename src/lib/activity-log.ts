import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/**
 * Log an activity. Fire-and-forget — never throws to callers.
 */
export async function logActivity(params: {
  userId?: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: Prisma.InputJsonValue
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ?? undefined,
      },
    })
  } catch (err) {
    // Swallow so callers are never impacted
    console.error('[activity-log][write-failed]', err)
  }
}
