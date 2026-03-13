import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { enqueueActivity } from '@/lib/queues/jobs'

/**
 * Log an activity. Dispatches to BullMQ queue if Redis is available,
 * otherwise writes directly. Fire-and-forget — never throws to callers.
 */
export async function logActivity(params: {
  userId?: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: Prisma.InputJsonValue
}) {
  try {
    const enqueued = await enqueueActivity({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as Record<string, unknown> | undefined,
    })
    if (enqueued) return

    // Fallback: write directly
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
