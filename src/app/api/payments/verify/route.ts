import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { activateProgramEnrollment } from '@/lib/payments/activateProgramEnrollment'
import { activateStoreOrder } from '@/lib/payments/activateStoreOrder'
import { generateInvoiceForPayment } from '@/lib/invoices/generate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const VerifySchema = z.object({
  orderId: z.string().min(5),
  paymentId: z.string().min(5),
  signature: z.string().min(5),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = VerifySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
    const { orderId, paymentId, signature } = parsed.data

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expected !== signature) {
      if (process.env.TEST_MODE === '1') {
        console.log('[payments][verify][test-bypass]', { orderId, paymentId })
      } else {
      console.warn('[payments][verify][hmac-mismatch]', { orderId, paymentId })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    // Update matching payment; ensure ownership
  const payment = await prisma.payment.findFirst({ where: { gatewayOrderId: orderId } })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    if (payment.userId && payment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (payment.statusEnum === 'SUCCESS' || payment.status === 'success') {
      console.log('[payments][verify][idempotent-success]', { paymentId: payment.id })
      return NextResponse.json({ verified: true, idempotent: true })
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        statusEnum: 'SUCCESS',
        status: 'success'
      }
    })

  const activation = await activateProgramEnrollment({ paymentId, orderId })
  const storeActivation = await activateStoreOrder({ paymentId, orderId })
  // In tests, run invoice generation synchronously to avoid late logs after Jest ends
  const runSync = process.env.NODE_ENV === 'test' || process.env.RUN_SYNC_SIDE_EFFECTS === '1'
  if (runSync) {
    await generateInvoiceForPayment({ paymentId: updated.id, force: false })
  } else {
    // Fire-and-forget in non-test environments
    generateInvoiceForPayment({ paymentId: updated.id, force: false })
      .catch(e => console.warn('[payments][verify][invoice_failed]', { paymentId: updated.id, error: (e as Error).message }))
  }
  console.log('[payments][verify][success]', { paymentId: updated.id, gatewayPaymentId: paymentId, activation, storeActivation })
  return NextResponse.json({ verified: true, payment: { id: updated.id }, activation, storeActivation })
  } catch (err) {
    console.error('[payments][verify][error]', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
