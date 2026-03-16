import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CalendarDays } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function ProgramsPreview() {
  const programs = await prisma.program.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      totalSessions: true,
      durationMinutes: true,
      pricePaise: true,
    },
  })

  if (programs.length === 0) return null

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold text-center mb-4">
        Transformational Healing Programs
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Structured programs designed to guide you through deep, lasting
        transformation.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {programs.map((program) => (
          <Link key={program.id} href={`/programs/${program.slug}`}>
            <Card className="hover:shadow-lg hover:border-primary/40 transition-all group h-full">
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {program.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {program.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {program.totalSessions} sessions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {program.durationMinutes} min each
                  </span>
                </div>
                <p className="text-sm font-semibold mt-3">
                  ₹{(program.pricePaise / 100).toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="text-center mt-10">
        <Button asChild size="lg" className="focus-ring">
          <Link href="/programs">View All Programs</Link>
        </Button>
      </div>
    </section>
  )
}
