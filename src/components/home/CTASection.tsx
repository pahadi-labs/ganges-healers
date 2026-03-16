import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Headphones, Users, GraduationCap } from "lucide-react"

export default function CTASection() {
  return (
    <section className="py-20 text-center">
      <h2 className="text-3xl font-bold mb-4">
        Ready to Begin Your Transformation?
      </h2>
      <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
        Whether you need a single session, a structured program, or just want
        to explore — there&apos;s a path for you.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Button asChild size="lg" className="focus-ring">
          <Link href="/services">
            <Sparkles className="mr-2 h-4 w-4" />
            Book a Session
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="focus-ring">
          <Link href="/audio">
            <Headphones className="mr-2 h-4 w-4" />
            Free Audio
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="focus-ring">
          <Link href="/programs">
            <GraduationCap className="mr-2 h-4 w-4" />
            Programs
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="focus-ring">
          <Link href="/community">
            <Users className="mr-2 h-4 w-4" />
            Community
          </Link>
        </Button>
      </div>
    </section>
  )
}
