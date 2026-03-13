import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where = category ? { category } : {}

    const tracks = await prisma.audioTrack.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Derive unique categories for filtering
    const categories = await prisma.audioTrack.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return NextResponse.json({
      tracks,
      categories: categories.map((c) => c.category),
    })
  } catch (err) {
    console.error('[audio][list][error]', err)
    return NextResponse.json({ error: 'Failed to fetch audio tracks' }, { status: 500 })
  }
}
