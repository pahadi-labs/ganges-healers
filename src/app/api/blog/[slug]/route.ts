import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const post = await prisma.blogPost.findFirst({
      where: { OR: [{ id: slug }, { slug }], published: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (err) {
    console.error('[blog][detail][error]', err)
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 })
  }
}
