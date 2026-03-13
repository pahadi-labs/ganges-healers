import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        imageUrl: true,
        createdAt: true,
      },
    })

    return NextResponse.json(posts)
  } catch (err) {
    console.error('[blog][list][error]', err)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}
