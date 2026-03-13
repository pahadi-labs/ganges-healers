import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({
        services: [],
        healers: [],
        programs: [],
        courses: [],
        products: [],
        blog: [],
        audio: [],
      })
    }

    const contains = { contains: q, mode: 'insensitive' as const }

    const [services, healers, programs, courses, products, blog, audio] =
      await Promise.all([
        prisma.service.findMany({
          where: {
            isActive: true,
            OR: [{ name: contains }, { description: contains }, { category: contains }],
          },
          select: { id: true, slug: true, name: true, category: true, tagline: true },
          take: 10,
        }),
        prisma.healer.findMany({
          where: {
            isActive: true,
            OR: [
              { user: { name: contains } },
              { bio: contains },
              { specializations: { has: q } },
            ],
          },
          select: {
            id: true,
            bio: true,
            specializations: true,
            user: { select: { name: true, image: true } },
          },
          take: 10,
        }),
        prisma.program.findMany({
          where: {
            isActive: true,
            OR: [{ title: contains }, { description: contains }],
          },
          select: { id: true, slug: true, title: true, pricePaise: true },
          take: 10,
        }),
        prisma.course.findMany({
          where: {
            isActive: true,
            OR: [{ title: contains }, { description: contains }],
          },
          select: { id: true, slug: true, title: true, pricePaise: true, imageUrl: true },
          take: 10,
        }),
        prisma.product.findMany({
          where: {
            isActive: true,
            OR: [{ title: contains }, { shortDescription: contains }],
          },
          select: { id: true, slug: true, title: true, pricePaise: true, imageUrl: true },
          take: 10,
        }),
        prisma.blogPost.findMany({
          where: {
            published: true,
            OR: [{ title: contains }, { content: contains }, { excerpt: contains }],
          },
          select: { id: true, slug: true, title: true, excerpt: true, createdAt: true },
          take: 10,
        }),
        prisma.audioTrack.findMany({
          where: {
            OR: [{ title: contains }, { description: contains }, { category: contains }],
          },
          select: { id: true, slug: true, title: true, category: true, duration: true, isPremium: true },
          take: 10,
        }),
      ])

    return NextResponse.json({ services, healers, programs, courses, products, blog, audio })
  } catch (err) {
    console.error('[search][error]', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
