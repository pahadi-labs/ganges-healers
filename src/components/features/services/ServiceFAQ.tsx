import { canonicalOf } from "@/config/site"

interface FAQ {
  question: string
  answer: string
}

interface ServiceFAQProps {
  serviceName: string
  serviceSlug: string
  duration: number
  price: number
  mode: string
  faqs?: FAQ[]
}

function defaultFAQs(name: string, duration: number, price: number, mode: string): FAQ[] {
  const modeText =
    mode === "ONLINE" ? "online via secure video call"
      : mode === "OFFLINE" ? "in-person at our healing centre"
        : "available both online and in-person"
  return [
    {
      question: `Is the ${name} session online or in person?`,
      answer: `Our ${name} sessions are ${modeText}. You will receive a confirmation with all details after booking.`,
    },
    {
      question: `How long does a ${name} session last?`,
      answer: `Each session lasts ${duration} minutes. We recommend arriving 5 minutes early and keeping 10 minutes after for integration.`,
    },
    {
      question: `How much does a ${name} session cost?`,
      answer: `A single session costs ₹${price}. VIP members may use session credits for free sessions.`,
    },
    {
      question: `Do I need any preparation before the session?`,
      answer: `No special preparation is required. Wear comfortable clothing, find a quiet private space, and come with an open mind.`,
    },
    {
      question: `What if I need to cancel or reschedule?`,
      answer: `You can reschedule or cancel up to 24 hours before the session. Full refunds are available for cancellations made 48+ hours in advance.`,
    },
    {
      question: `When will I see results from ${name}?`,
      answer: `Many clients experience shifts after a single session. For deeper, lasting transformation, a series of 3–6 sessions is typically recommended.`,
    },
  ]
}

export default function ServiceFAQ({ serviceName, serviceSlug, duration, price, mode, faqs }: ServiceFAQProps) {
  const items = faqs && faqs.length > 0 ? faqs : defaultFAQs(serviceName, duration, price, mode)

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="divide-y rounded-lg border">
        {items.map((f) => (
          <details key={f.question} className="group px-5 py-4">
            <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
              {f.question}
              <span className="text-muted-foreground transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {f.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
