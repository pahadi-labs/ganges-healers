import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    const course = await prisma.course.findFirst({
      where: { OR: [{ id: slug }, { slug }], isActive: true },
      include: {
        lessons: { orderBy: { order: 'asc' }, select: { id: true, title: true, order: true } },
        _count: { select: { enrollments: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (err) {
    console.error('[courses][detail][error]', err)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}
