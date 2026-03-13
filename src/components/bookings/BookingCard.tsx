"use client"

import { NormalizedBooking } from '@/app/dashboard/bookings/page'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  booking: NormalizedBooking
  onReschedule: () => void
  onCancel: () => void
}

function formatLocal(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

export default function BookingCard({ booking, onReschedule, onCancel }: Props) {
  const { serviceName, healerName, startIso, status, isCancelable, isReschedulable } = booking

  return (
    <Card className="p-4 flex items-center justify-between" data-test="booking-card">
      <div className="space-y-1">
        <div className="font-medium">{serviceName}</div>
        <div className="text-sm text-muted-foreground">with {healerName}</div>
        <div className="text-sm">{formatLocal(startIso)}</div>
        <div className={cn('text-xs inline-flex rounded px-2 py-0.5 border',
          status === 'CANCELLED' ? 'border-destructive text-destructive' : 'border-muted-foreground text-muted-foreground'
        )} aria-label={`status ${status}`}>{status}</div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={!isReschedulable} onClick={onReschedule} aria-disabled={!isReschedulable} title={!isReschedulable ? 'Cannot reschedule within 24h' : 'Reschedule'}>
          Reschedule
        </Button>
        <Button variant="destructive" disabled={!isCancelable} onClick={onCancel} aria-disabled={!isCancelable} title={!isCancelable ? 'Cannot cancel within 24h' : 'Cancel'}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}
