import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const startTime = Date.now()

async function checkDatabase(): Promise<{ status: 'ok' | 'error'; latencyMs?: number; error?: string }> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    return { status: 'error', latencyMs: Date.now() - start, error: String(err) }
  }
}

async function checkRedis(): Promise<{ status: 'ok' | 'unavailable' | 'error'; latencyMs?: number }> {
  if (!process.env.REDIS_URL) return { status: 'unavailable' }
  const start = Date.now()
  try {
    const IORedis = (await import('ioredis')).default
    const redis = new IORedis(process.env.REDIS_URL, { connectTimeout: 3000, lazyConnect: true })
    await redis.connect()
    await redis.ping()
    const latencyMs = Date.now() - start
    await redis.disconnect()
    return { status: 'ok', latencyMs }
  } catch {
    return { status: 'error', latencyMs: Date.now() - start }
  }
}

async function checkQueues(): Promise<{ status: 'ok' | 'unavailable' | 'error'; counts?: Record<string, number> }> {
  if (!process.env.REDIS_URL) return { status: 'unavailable' }
  try {
    const { getEmailQueue, getNotificationQueue, getActivityQueue } = await import('@/lib/queues/jobs')
    const eq = getEmailQueue()
    const nq = getNotificationQueue()
    const aq = getActivityQueue()
    if (!eq || !nq || !aq) return { status: 'unavailable' }
    const [email, notification, activity] = await Promise.all([
      eq.getJobCounts('waiting', 'active', 'failed'),
      nq.getJobCounts('waiting', 'active', 'failed'),
      aq.getJobCounts('waiting', 'active', 'failed'),
    ])
    return {
      status: 'ok',
      counts: {
        emailWaiting: email.waiting ?? 0,
        emailActive: email.active ?? 0,
        emailFailed: email.failed ?? 0,
        notificationWaiting: notification.waiting ?? 0,
        notificationActive: notification.active ?? 0,
        notificationFailed: notification.failed ?? 0,
        activityWaiting: activity.waiting ?? 0,
        activityActive: activity.active ?? 0,
        activityFailed: activity.failed ?? 0,
      },
    }
  } catch {
    return { status: 'error' }
  }
}

export async function GET() {
  const [database, redis, queues] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkQueues(),
  ])

  const overallOk = database.status === 'ok'
  const uptimeMs = Date.now() - startTime

  const body = {
    ok: overallOk,
    ts: Date.now(),
    uptime: {
      ms: uptimeMs,
      human: formatUptime(uptimeMs),
    },
    database,
    redis,
    queues,
  }

  return new Response(JSON.stringify(body), {
    status: overallOk ? 200 : 503,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      pragma: 'no-cache',
      expires: '0',
    },
  })
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  parts.push(`${sec}s`)
  return parts.join(' ')
}
