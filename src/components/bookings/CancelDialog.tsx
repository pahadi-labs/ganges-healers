"use client"

import { useMemo, useState, useId } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NormalizedBooking } from '@/app/dashboard/bookings/page'
import { computeRefund } from '@/lib/bookings/refund-policy'
import { track } from '@/lib/analytics/client'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: NormalizedBooking
  onSuccess: (result: { band: 'FULL'|'HALF'|'NONE'; refundPaise: number }) => void
}

export default function CancelDialog({ open, onOpenChange, booking, onSuccess }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>('')
  const titleId = useId()

  const preview = useMemo(() => {
    const now = new Date()
    return computeRefund(new Date(booking.startIso), now, booking.amountPaise)
  }, [booking.amountPaise, booking.startIso])

  async function confirm() {
    setPending(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed (${res.status})`)
      }
      const j = await res.json().catch(() => ({}))
      const refund = j?.refund || preview
      onSuccess(refund)
  track('booking_cancel_success', { bookingId: booking.id, serviceSlug: booking.serviceSlug, path: '/dashboard/bookings', ts: Date.now() })
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId}>Cancel booking</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Confirm cancellation and review refund policy</DialogDescription>
        <div className="space-y-4">
          <p>Refund band: <strong>{preview.band}</strong>{preview.refundPaise > 0 ? ` (₹${(preview.refundPaise/100).toFixed(2)})` : ''}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button variant="destructive" onClick={confirm} disabled={pending}>{pending ? 'Cancelling...' : 'Confirm cancel'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
