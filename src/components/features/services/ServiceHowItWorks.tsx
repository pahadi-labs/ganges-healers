import { ClipboardCheck, Video, Sparkles, HeartPulse } from "lucide-react"

const steps = [
  {
    icon: ClipboardCheck,
    title: "Book Your Session",
    desc: "Choose a healer and pick a convenient date and time slot.",
  },
  {
    icon: Video,
    title: "Receive Meeting Link",
    desc: "Get a secure video meeting link sent to your email.",
  },
  {
    icon: Sparkles,
    title: "Join the Session",
    desc: "Connect with your healer for a guided, personalized session.",
  },
  {
    icon: HeartPulse,
    title: "Follow-Up Guidance",
    desc: "Receive aftercare recommendations to continue your transformation.",
  },
]

export default function ServiceHowItWorks() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">How This Session Works</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {i + 1}
            </div>
            <div>
              <h3 className="font-medium text-sm">{s.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
