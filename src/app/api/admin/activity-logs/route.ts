import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    const where = entityType ? { entityType } : {}

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ logs })
  } catch (err) {
    const status = (err as { status?: number }).status || 500
    const message = err instanceof Error ? err.message : 'Failed to fetch activity logs'
    return NextResponse.json({ error: message }, { status })
  }
}
