"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

interface Booking {
  id: string
  scheduledAt: string
  durationMin: number
  status: string
  pricePaise: number
  user: { id: string; name: string | null; email: string; image: string | null }
  service: { name: string; category: string; slug: string; duration: number }
  payment: { status: string; amountPaise: number; statusEnum: string | null } | null
}

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  SCHEDULED: "secondary",
  CONFIRMED: "default",
  RESCHEDULED: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
}

export default function HealerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/healer/bookings")
      if (!res.ok) throw new Error("Failed to load bookings")
      const json = await res.json()
      setBookings(json.data ?? [])
    } catch {
      toast.error("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleAction = async (bookingId: string, action: "CONFIRM" | "CANCEL" | "COMPLETE") => {
    setActing(bookingId + action)
    try {
      const res = await fetch(`/api/healer/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Action failed")
      }
      const { data } = await res.json()
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: data.status } : b)),
      )
      toast.success(`Booking ${action.toLowerCase()}ed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    } finally {
      setActing(null)
    }
  }

  const now = new Date()
  const upcoming = bookings.filter(
    (b) => new Date(b.scheduledAt) >= now && !["CANCELLED", "COMPLETED"].includes(b.status),
  )
  const past = bookings.filter(
    (b) => new Date(b.scheduledAt) < now || ["COMPLETED"].includes(b.status),
  )
  const pending = bookings.filter((b) => b.status === "PENDING")

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manage Bookings</h1>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <BookingList
            bookings={upcoming}
            acting={acting}
            onAction={handleAction}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <BookingList
            bookings={pending}
            acting={acting}
            onAction={handleAction}
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <BookingList
            bookings={past}
            acting={acting}
            onAction={handleAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BookingList({
  bookings,
  acting,
  onAction,
}: {
  bookings: Booking[]
  acting: string | null
  onAction: (id: string, action: "CONFIRM" | "CANCEL" | "COMPLETE") => void
}) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No bookings
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <Card key={b.id}>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">{b.user.name || b.user.email}</p>
                <p className="text-sm text-muted-foreground">{b.service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(b.scheduledAt), "MMM d, yyyy · h:mm a")} ·{" "}
                  {b.durationMin} min
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={statusColor[b.status] ?? "outline"}>
                    {b.status}
                  </Badge>
                  {b.payment && (
                    <Badge variant="secondary" className="text-xs">
                      ₹{(b.payment.amountPaise / 100).toLocaleString("en-IN")}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {(b.status === "PENDING" || b.status === "SCHEDULED") && (
                    <Button
                      size="sm"
                      onClick={() => onAction(b.id, "CONFIRM")}
                      disabled={acting === b.id + "CONFIRM"}
                    >
                      {acting === b.id + "CONFIRM" ? "…" : "Confirm"}
                    </Button>
                  )}
                  {b.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      onClick={() => onAction(b.id, "COMPLETE")}
                      disabled={acting === b.id + "COMPLETE"}
                    >
                      {acting === b.id + "COMPLETE" ? "…" : "Complete"}
                    </Button>
                  )}
                  {!["CANCELLED", "COMPLETED"].includes(b.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onAction(b.id, "CANCEL")}
                      disabled={acting === b.id + "CANCEL"}
                    >
                      {acting === b.id + "CANCEL" ? "…" : "Cancel"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
