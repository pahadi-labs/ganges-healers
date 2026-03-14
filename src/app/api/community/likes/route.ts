import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireVIP } from '@/lib/auth/requireVIP'
import { z } from 'zod'

const likeSchema = z.object({
  postId: z.string().min(1),
})

// POST /api/community/likes — toggle like (VIP only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireVIP()

    const body = await request.json()
    const parsed = likeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const userId = session.user!.id
    const { postId } = parsed.data

    // Verify post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true },
    })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Toggle: if already liked → unlike, else → like
    const existing = await prisma.communityLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })

    if (existing) {
      await prisma.communityLike.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, liked: false })
    }

    await prisma.communityLike.create({
      data: { postId, userId },
    })

    return NextResponse.json({ success: true, liked: true })
  } catch (error: unknown) {
    const status = (error as { status?: number }).status
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: (error as Error).message }, { status })
    }
    console.error('Community like POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
