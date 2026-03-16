import { Shield, RefreshCcw, CheckCircle } from "lucide-react"

export default function ServiceRefundPolicy() {
  return (
    <section className="rounded-lg border bg-muted/40 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Booking Protection</h3>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          Full refund if cancelled 48+ hours before the session
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          50% refund if cancelled 24–48 hours before
        </li>
        <li className="flex items-start gap-2">
          <RefreshCcw className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          Free rescheduling available 24+ hours in advance
        </li>
      </ul>
    </section>
  )
}
