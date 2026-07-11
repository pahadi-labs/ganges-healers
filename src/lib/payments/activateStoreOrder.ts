import { prisma } from '@/lib/prisma'

interface ActivateArgs {
  paymentId?: string
  orderId?: string
}

export interface StoreActivationResult {
  found: boolean
  isStore: boolean
  hasOrderId: boolean
  activated: boolean
  idempotent: boolean
  orderId?: string
  paymentId?: string
  reason?: string
}

export async function activateStoreOrder(args: ActivateArgs): Promise<StoreActivationResult> {
  const orClauses: { gatewayPaymentId?: string; gatewayOrderId?: string }[] = []
  if (args.paymentId) orClauses.push({ gatewayPaymentId: args.paymentId })
  if (args.orderId) orClauses.push({ gatewayOrderId: args.orderId })
  if (!orClauses.length) {
    return { found: false, isStore: false, hasOrderId: false, activated: false, idempotent: false, reason: 'no_identifiers' }
  }

  const payment = await prisma.payment.findFirst({ where: { OR: orClauses } })
  if (!payment) {
    return { found: false, isStore: false, hasOrderId: false, activated: false, idempotent: false, reason: 'payment_not_found', paymentId: args.paymentId, orderId: args.orderId }
  }

  if (payment.type !== 'STORE') {
    return { found: true, isStore: false, hasOrderId: false, activated: false, idempotent: false, reason: 'not_store', paymentId: payment.id }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta: any = payment.metadata || {}
  const storeOrderId = meta.orderId as string | undefined
  if (!storeOrderId) {
    console.warn('[store][activation][missing_orderId]', { paymentId: payment.id })
    return { found: true, isStore: true, hasOrderId: false, activated: false, idempotent: false, reason: 'missing_orderId', paymentId: payment.id }
  }

  const order = await prisma.order.findUnique({ where: { id: storeOrderId } })
  if (!order) {
    console.warn('[store][activation][order_not_found]', { storeOrderId, paymentId: payment.id })
    return { found: true, isStore: true, hasOrderId: true, activated: false, idempotent: false, reason: 'order_not_found', orderId: storeOrderId, paymentId: payment.id }
  }

  if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
    return { found: true, isStore: true, hasOrderId: true, activated: false, idempotent: true, orderId: storeOrderId, paymentId: payment.id }
  }

  if (order.status !== 'pending_payment') {
    return { found: true, isStore: true, hasOrderId: true, activated: false, idempotent: false, reason: 'unexpected_status', orderId: storeOrderId, paymentId: payment.id }
  }

  await prisma.order.update({
    where: { id: storeOrderId },
    data: { status: 'paid', paymentId: payment.id },
  })

  // Decrement stock counts and auto-disable sold-out products
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: storeOrderId },
    select: { productId: true, quantity: true },
  })
  for (const item of orderItems) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { stockCount: true },
    })
    if (product?.stockCount !== null && product?.stockCount !== undefined) {
      const newCount = Math.max(0, product.stockCount - item.quantity)
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockCount: newCount,
          ...(newCount === 0 ? { stockStatus: 'OUT' } : newCount <= 5 ? { stockStatus: 'LOW' } : {}),
        },
      })
    }
  }

  console.log('[store][activation][activated]', { orderId: storeOrderId, paymentId: payment.id })
  return { found: true, isStore: true, hasOrderId: true, activated: true, idempotent: false, orderId: storeOrderId, paymentId: payment.id }
}
