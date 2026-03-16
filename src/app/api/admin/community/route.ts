import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/rbac'
import { logActivity } from '@/lib/activity-log'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/community — moderation queue + community metrics
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch (e) {
    const status = (e as { status?: number }).status || 403
    return NextResponse.json({ error: 'Forbidden' }, { status })
  }

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') ?? 'reports'

  if (view === 'metrics') {
    return getMetrics()
  }
  return getReports(searchParams)
}

async function getReports(searchParams: URLSearchParams) {
  const status = searchParams.get('status') ?? 'pending'
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

  const reports = await prisma.communityReport.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
    },
  })

  // Enrich reports with target content
  const enriched = await Promise.all(
    reports.map(async (report) => {
      let target = null
      if (report.targetType === 'post') {
        target = await prisma.communityPost.findUnique({
          where: { id: report.targetId },
          select: { id: true, title: true, content: true, userId: true, deletedAt: true, user: { select: { name: true } } },
        })
      } else if (report.targetType === 'comment') {
        target = await prisma.communityComment.findUnique({
          where: { id: report.targetId },
          select: { id: true, content: true, userId: true, deletedAt: true, user: { select: { name: true } } },
        })
      }
      return { ...report, target }
    }),
  )

  const pendingCount = await prisma.communityReport.count({ where: { status: 'pending' } })

  return NextResponse.json({ success: true, data: enriched, pendingCount })
}

async function getMetrics() {
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalPosts,
    postsToday,
    postsThisWeek,
    totalComments,
    commentsThisWeek,
    totalUsers,
    activeContributorsWeek,
    vipParticipants,
  ] = await Promise.all([
    prisma.communityPost.count({ where: { deletedAt: null } }),
    prisma.communityPost.count({ where: { deletedAt: null, createdAt: { gte: dayAgo } } }),
    prisma.communityPost.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
    prisma.communityComment.count({ where: { deletedAt: null } }),
    prisma.communityComment.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
    prisma.user.count(),
    // Users who posted or commented in last 7 days
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT uid) as count FROM (
        SELECT "userId" as uid FROM "CommunityPost" WHERE "deletedAt" IS NULL AND "createdAt" >= ${weekAgo}
        UNION
        SELECT "userId" as uid FROM "CommunityComment" WHERE "deletedAt" IS NULL AND "createdAt" >= ${weekAgo}
      ) sub
    `,
    // VIP users who posted or commented ever
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT u."id") as count FROM "User" u
      WHERE u."vip" = true AND (
        EXISTS (SELECT 1 FROM "CommunityPost" cp WHERE cp."userId" = u."id" AND cp."deletedAt" IS NULL)
        OR EXISTS (SELECT 1 FROM "CommunityComment" cc WHERE cc."userId" = u."id" AND cc."deletedAt" IS NULL)
      )
    `,
  ])

  // Average comments per post
  const avgComments = totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : '0'

  return NextResponse.json({
    success: true,
    data: {
      totalPosts,
      postsToday,
      postsThisWeek,
      totalComments,
      commentsThisWeek,
      avgCommentsPerPost: parseFloat(avgComments),
      totalUsers,
      activeContributorsThisWeek: Number(activeContributorsWeek[0]?.count ?? 0),
      vipParticipants: Number(vipParticipants[0]?.count ?? 0),
    },
  })
}

// PATCH /api/admin/community — review a report (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin()

    const body = await request.json()
    const { reportId, action } = body as { reportId?: string; action?: string }

    if (!reportId || !action || !['reviewed', 'dismissed'].includes(action)) {
      return NextResponse.json({ error: 'reportId and action (reviewed|dismissed) required' }, { status: 400 })
    }

    const report = await prisma.communityReport.findUnique({
      where: { id: reportId },
      select: { id: true, status: true, targetType: true, targetId: true },
    })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // If action = reviewed, also soft-delete the target content
    if (action === 'reviewed') {
      if (report.targetType === 'post') {
        await prisma.communityPost.update({
          where: { id: report.targetId },
          data: { deletedAt: new Date(), deletedById: session.user!.id },
        })
      } else if (report.targetType === 'comment') {
        await prisma.communityComment.update({
          where: { id: report.targetId },
          data: { deletedAt: new Date(), deletedById: session.user!.id },
        })
      }
    }

    const updated = await prisma.communityReport.update({
      where: { id: reportId },
      data: {
        status: action,
        reviewedBy: session.user!.id,
        reviewedAt: new Date(),
      },
    })

    logActivity({
      userId: session.user!.id,
      action: `community_report_${action}`,
      entityType: 'community_report',
      entityId: reportId,
      metadata: { targetType: report.targetType, targetId: report.targetId },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const status = (error as { status?: number }).status || 500
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status })
  }
}
