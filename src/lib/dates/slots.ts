export function floorTo30Min(date: Date): Date {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 30), 0, 0)
  return d
}

export function ceilTo30Min(date: Date): Date {
  const d = floorTo30Min(date)
  if (d.getTime() < date.getTime()) d.setMinutes(d.getMinutes() + 30)
  return d
}

export function addMinutes(date: Date, minutes: number): Date {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() + minutes)
  return d
}

export function makeSlots(base: Date, count: number): Date[] {
  const start = floorTo30Min(base)
  return Array.from({ length: count }, (_, i) => addMinutes(start, i * 30))
}
