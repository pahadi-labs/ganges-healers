import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHealer } from '@/lib/auth/requireHealer'
import { z } from 'zod'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const dayWindowSchema = z
  .object({
    start: z.string().regex(timeRegex, 'Use HH:MM format (e.g. "10:00")'),
    end: z.string().regex(timeRegex, 'Use HH:MM format (e.g. "18:00")'),
  })
  .nullable()

const availabilitySchema = z
  .object({
    monday: dayWindowSchema.optional(),
    tuesday: dayWindowSchema.optional(),
    wednesday: dayWindowSchema.optional(),
    thursday: dayWindowSchema.optional(),
    friday: dayWindowSchema.optional(),
    saturday: dayWindowSchema.optional(),
    sunday: dayWindowSchema.optional(),
  })
  .refine(
    (val) => {
      for (const day of DAYS) {
        const w = val[day]
        if (w && w.start >= w.end) return false
      }
      return true
    },
    { message: 'start time must be before end time for each day' },
  )

export async function PUT(request: NextRequest) {
  try {
    const { healer } = await requireHealer()

    const body = await request.json()
    const parsed = availabilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Normalise: missing days become null
    const schedule: Record<string, { start: string; end: string } | null> = {}
    for (const day of DAYS) {
      schedule[day] = parsed.data[day] ?? null
    }

    const updated = await prisma.healer.update({
      where: { id: healer.id },
      data: { availability: schedule },
      select: { id: true, availability: true },
    })

    return NextResponse.json({ success: true, data: updated.availability })
  } catch (error: unknown) {
    const status = (error as { status?: number }).status
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status },
      )
    }
    console.error('Healer availability PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
