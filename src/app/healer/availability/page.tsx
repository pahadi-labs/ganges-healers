"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
type Day = (typeof DAYS)[number]

const LABEL: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

interface DayWindow {
  start: string
  end: string
}

type Schedule = Record<Day, DayWindow | null>

const DEFAULT_WINDOW: DayWindow = { start: "10:00", end: "18:00" }

// Generate 30-min time options from 00:00 to 23:30
const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }
}

function countSlots(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? Math.floor(mins / 30) : 0
}

export default function AvailabilityEditorPage() {
  const [schedule, setSchedule] = useState<Schedule>(
    Object.fromEntries(DAYS.map((d) => [d, null])) as Schedule,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/healer/profile")
        if (!res.ok) throw new Error()
        const { data } = await res.json()
        const avail = data?.availability as Record<string, DayWindow | null> | null
        if (avail) {
          const s = { ...schedule }
          for (const day of DAYS) {
            s[day] = avail[day] ?? null
          }
          setSchedule(s)
        }
      } catch {
        toast.error("Failed to load availability")
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleDay = (day: Day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { ...DEFAULT_WINDOW },
    }))
  }

  const updateTime = (day: Day, field: "start" | "end", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : null,
    }))
  }

  const handleSave = async () => {
    // Client-side validation: start < end
    for (const day of DAYS) {
      const w = schedule[day]
      if (w && w.start >= w.end) {
        toast.error(`${LABEL[day]}: start time must be before end time`)
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch("/api/healer/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Save failed")
      }
      toast.success("Availability saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit Availability</h1>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Set your available hours for each day. Times use 30-minute increments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const w = schedule[day]
            const slots = w ? countSlots(w.start, w.end) : 0
            return (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b last:border-0"
              >
                {/* Toggle + Label */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!w}
                    onClick={() => toggleDay(day)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      w ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        w ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium w-24">{LABEL[day]}</span>
                </div>

                {/* Time Selects */}
                {w ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={w.start}
                      onChange={(e) => updateTime(day, "start", e.target.value)}
                      className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground text-sm">to</span>
                    <select
                      value={w.end}
                      onChange={(e) => updateTime(day, "end", e.target.value)}
                      className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground ml-2">
                      {slots} slot{slots !== 1 ? "s" : ""}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Day off</span>
                )}
              </div>
            )
          })}

          <Button onClick={handleSave} disabled={saving} className="mt-4">
            {saving ? "Saving…" : "Save Availability"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
