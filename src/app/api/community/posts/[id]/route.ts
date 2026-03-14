import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/community/posts/[id] — fetch single post with comments
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { likes: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if current user has liked this post
    const userLike = await prisma.communityLike.findUnique({
      where: { postId_userId: { postId: id, userId: session.user.id } },
      select: { id: true },
    })

    return NextResponse.json({
      success: true,
      data: { ...post, liked: !!userLike },
    })
  } catch (error) {
    console.error('Community post GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
