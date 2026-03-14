import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireVIP } from '@/lib/auth/requireVIP'
import { z } from 'zod'
import { logActivity } from '@/lib/activity-log'

// GET /api/community/posts — list posts with pagination (auth required, reading open to all logged-in users)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') ?? undefined
    const take = Math.min(Number(searchParams.get('take')) || 20, 50)

    const posts = await prisma.communityPost.findMany({
      take: take + 1, // fetch one extra to detect next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true, likes: true } },
      },
    })

    const hasMore = posts.length > take
    if (hasMore) posts.pop()

    const nextCursor = hasMore ? posts[posts.length - 1]?.id : null

    return NextResponse.json({
      success: true,
      data: posts,
      nextCursor,
    })
  } catch (error) {
    console.error('Community posts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
})

// POST /api/community/posts — create post (VIP only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireVIP()

    const body = await request.json()
    const parsed = createPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const post = await prisma.communityPost.create({
      data: {
        userId: session.user!.id,
        title: parsed.data.title,
        content: parsed.data.content,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true, likes: true } },
      },
    })

    logActivity({ userId: session.user!.id, action: 'community_post_created', entityType: 'community_post', entityId: post.id })
    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error: unknown) {
    const status = (error as { status?: number }).status
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: (error as Error).message }, { status })
    }
    console.error('Community posts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
