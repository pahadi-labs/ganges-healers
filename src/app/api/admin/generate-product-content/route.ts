import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/rbac'
import { generateProductContent } from '@/lib/ai/generate-product-content'
import { z } from 'zod'

const inputSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  chakra: z.string().min(1).max(50),
  material: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
})

export async function POST(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const content = await generateProductContent(parsed.data)
    return NextResponse.json(content)
  } catch (err) {
    console.error('[AI Generate Product Content]', err)
    return NextResponse.json(
      { error: 'Failed to generate content. Please check your OpenAI API key and try again.' },
      { status: 500 },
    )
  }
}
