import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logActivity } from '@/lib/activity-log'

const reportSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().min(1),
  reason: z.string().min(5).max(500),
})

// POST /api/community/reports — report a post or comment (auth required)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { targetType, targetId, reason } = parsed.data

    // Verify target exists
    if (targetType === 'post') {
      const post = await prisma.communityPost.findUnique({
        where: { id: targetId, deletedAt: null },
        select: { id: true },
      })
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
    } else {
      const comment = await prisma.communityComment.findUnique({
        where: { id: targetId, deletedAt: null },
        select: { id: true },
      })
      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
    }

    // Prevent duplicate reports
    const existing = await prisma.communityReport.findFirst({
      where: {
        userId: session.user.id,
        targetType,
        targetId,
        status: 'pending',
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 409 })
    }

    const report = await prisma.communityReport.create({
      data: {
        userId: session.user.id,
        targetType,
        targetId,
        reason,
      },
    })

    logActivity({
      userId: session.user.id,
      action: 'community_report_created',
      entityType: `community_${targetType}`,
      entityId: targetId,
      metadata: { reportId: report.id },
    })

    return NextResponse.json({ success: true, data: { id: report.id } }, { status: 201 })
  } catch (error) {
    console.error('Community report POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
