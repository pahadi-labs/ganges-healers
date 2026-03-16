import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Headphones } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="text-center py-20 md:py-28">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
        Holistic Healing Marketplace
      </p>
      <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
        Transform Your Mind, Body &amp; Spirit
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
        Book healing sessions with experienced practitioners, access guided
        meditations, and join a community committed to conscious living.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg" className="focus-ring text-base px-8">
          <Link href="/services">
            <Sparkles className="mr-2 h-5 w-5" />
            Start Your Healing Journey
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="focus-ring text-base px-8">
          <Link href="/audio">
            <Headphones className="mr-2 h-5 w-5" />
            Explore Free Audio
          </Link>
        </Button>
      </div>
    </section>
  )
}
