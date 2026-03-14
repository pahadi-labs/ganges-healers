import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { logActivity } from '@/lib/activity-log'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ProgressSchema = z.object({
  lessonOrder: z.number().int().min(0),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = ProgressSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const course = await prisma.course.findFirst({
      where: { OR: [{ id: slug }, { slug }], isActive: true },
      include: { _count: { select: { lessons: true } } },
    })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { userId: session.user.id, courseId: course.id, status: { in: ['active', 'completed'] } },
    })
    if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

    // Progress = number of completed lessons (1-indexed from lesson order)
    const newProgress = Math.max(enrollment.progress, parsed.data.lessonOrder + 1)
    const isCompleted = newProgress >= course._count.lessons

    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: newProgress,
        ...(isCompleted ? { status: 'completed' } : {}),
      },
    })

    logActivity({ userId: session.user.id, action: isCompleted ? 'course_completed' : 'lesson_completed', entityType: 'course', entityId: course.id, metadata: { progress: updated.progress, lessonOrder: parsed.data.lessonOrder } })
    return NextResponse.json({ progress: updated.progress, status: updated.status })
  } catch (err) {
    console.error('[courses][progress][error]', err)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
