// src/app/api/invoices/[id]/route.ts
import { NextResponse } from 'next/server'
import { resolveInvoiceUrl } from '@/lib/invoices/resolve'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const url = await resolveInvoiceUrl(id)
  if (!url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Public route contract: 302 redirect to the resolved PDF URL
  return NextResponse.redirect(url, 302)
}
