"use client"

import { useCallback, useEffect, useMemo, useState, useId } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { NormalizedBooking } from '@/app/dashboard/bookings/page'
import { track } from '@/lib/analytics/client'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: NormalizedBooking
  onSuccess: (updated: NormalizedBooking) => void
}

type Slot = { iso: string; label: string }

function make30MinSlots(baseIso: string, count = 12): Slot[] {
  const base = new Date(baseIso)
  base.setMinutes(0, 0, 0)
  const out: Slot[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setMinutes(base.getMinutes() + i * 30)
    out.push({ iso: d.toISOString(), label: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) })
  }
  return out
}

export default function RescheduleModal({ open, onOpenChange, booking, onSuccess }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedDatetime, setSelectedDatetime] = useState<string>('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>('')
  const dateId = useId()
  const titleId = useId()

  // Generate some near-future slots based on chosen date; in real flow, we could fetch availability like BookingModal
  const slots: Slot[] = useMemo(() => {
    if (!selectedDate) return []
    // Noon baseline on selected day
    const noon = new Date(`${selectedDate}T12:00:00.000Z`)
    return make30MinSlots(noon.toISOString(), 20)
  }, [selectedDate])

  useEffect(() => {
    if (open) {
      setSelectedDate('')
      setSelectedDatetime('')
      setError('')
    }
  }, [open])

  const submit = useCallback(async () => {
    if (!selectedDatetime) return
    setPending(true)
    setError('')
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: selectedDatetime }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed (${res.status})`)
      }
      const newStart = new Date(selectedDatetime)
      const now = Date.now()
      const hoursUntil = (newStart.getTime() - now) / 36e5
      const updated: NormalizedBooking = {
        ...booking,
        startIso: newStart.toISOString(),
        status: 'RESCHEDULED',
        isCancelable: hoursUntil >= 24,
        isReschedulable: hoursUntil >= 24,
      }
      onSuccess(updated)
  track('booking_reschedule_success', { bookingId: booking.id, serviceSlug: booking.serviceSlug, path: '/dashboard/bookings', ts: Date.now() })
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reschedule')
    } finally {
      setPending(false)
    }
  }, [booking, onOpenChange, onSuccess, selectedDatetime])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId}>Reschedule booking</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Pick a new time for your session</DialogDescription>

        <div className="space-y-4">
          <div>
            <label htmlFor={dateId} className="text-sm font-medium">Select date</label>
            <input id={dateId} className="mt-1 w-full border rounded p-2" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          {selectedDate && (
            <div>
              <div className="text-sm mb-2">Available times</div>
              <div className="grid grid-cols-3 gap-2">
                {slots.map(s => (
                  <Button key={s.iso} type="button" variant={selectedDatetime === s.iso ? 'default' : 'outline'} onClick={() => setSelectedDatetime(s.iso)}>{s.label}</Button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={submit} disabled={!selectedDatetime || pending}>{pending ? 'Saving...' : 'Confirm'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
