import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cached } from '@/lib/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const courses = await cached('courses:list', () =>
      prisma.course.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { lessons: true } } },
      })
    )

    return NextResponse.json(courses)
  } catch (err) {
    console.error('[courses][list][error]', err)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
