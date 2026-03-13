import { Queue } from 'bullmq'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

/** Parse Redis URL into connection options for BullMQ */
function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      maxRetriesPerRequest: null as null,
    }
  } catch {
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null as null }
  }
}

const redisOpts = parseRedisUrl(REDIS_URL)

/** Email queue — booking confirmations, cancellations, reminders, invoices */
export const emailQueue = new Queue('email', {
  connection: redisOpts,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

/** Notification queue — create and push notifications to users */
export const notificationQueue = new Queue('notification', {
  connection: redisOpts,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

/** Activity log queue — async activity logging */
export const activityQueue = new Queue('activity', {
  connection: redisOpts,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
})

// ─── Job type definitions ───────────────────────────────────────

export type EmailJobData =
  | { type: 'booking_confirmation'; payload: { to: string; userName: string; serviceName: string; healerName: string; date: string; time: string; bookingId: string } }
  | { type: 'booking_cancellation'; payload: { to: string; userName: string; serviceName: string; date: string; time: string } }
  | { type: 'booking_reminder'; payload: { to: string; userName: string; serviceName: string; healerName: string; date: string; time: string; bookingId: string } }
  | { type: 'invoice'; payload: { to: string; invoiceNumber: string; amountPaise: number; link: string } }

export interface NotificationJobData {
  userId: string
  type: string
  title: string
  message: string
}

export interface ActivityJobData {
  userId?: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}

// ─── Helper functions to enqueue jobs ───────────────────────────

let redisAvailable: boolean | null = null

async function isRedisAvailable(): Promise<boolean> {
  if (redisAvailable !== null) return redisAvailable
  try {
    const IORedis = (await import('ioredis')).default
    const redis = new IORedis(REDIS_URL, { connectTimeout: 3000, lazyConnect: true })
    await redis.connect()
    await redis.ping()
    await redis.disconnect()
    redisAvailable = true
  } catch {
    redisAvailable = false
  }
  return redisAvailable
}

/** Enqueue an email job. Returns false if Redis is unavailable (caller should send inline). */
export async function enqueueEmail(data: EmailJobData): Promise<boolean> {
  if (!(await isRedisAvailable())) return false
  await emailQueue.add(data.type, data)
  return true
}

/** Enqueue a notification creation job. Returns false if Redis is unavailable. */
export async function enqueueNotification(data: NotificationJobData): Promise<boolean> {
  if (!(await isRedisAvailable())) return false
  await notificationQueue.add('create', data)
  return true
}

/** Enqueue an activity log job. Returns false if Redis is unavailable. */
export async function enqueueActivity(data: ActivityJobData): Promise<boolean> {
  if (!(await isRedisAvailable())) return false
  await activityQueue.add('log', data)
  return true
}
