import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface RelatedServicesProps {
  currentServiceId: string
  category: string
}

export default async function RelatedServices({ currentServiceId, category }: RelatedServicesProps) {
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      category,
      id: { not: currentServiceId },
    },
    orderBy: { popularity: "desc" },
    take: 3,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      duration: true,
      category: true,
    },
  })

  if (services.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Related Healing Services</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {services.map((s) => (
          <Link key={s.id} href={`/services/${s.slug}`}>
            <Card className="hover:shadow-lg hover:border-primary/40 transition-all group h-full">
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="self-start text-xs mb-1">
                  {(s.category ?? "General").replace(/_/g, " ")}
                </Badge>
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {s.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {s.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>₹{s.price}</span>
                  <span>{s.duration} min</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
