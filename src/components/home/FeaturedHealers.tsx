import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import Link from "next/link"

export default async function FeaturedHealers() {
  const healers = await prisma.healer.findMany({
    where: { isActive: true, isVerified: true },
    orderBy: { rating: "desc" },
    take: 4,
    select: {
      id: true,
      bio: true,
      experienceYears: true,
      rating: true,
      specializations: true,
      user: {
        select: { name: true, image: true },
      },
    },
  })

  if (healers.length === 0) return null

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold text-center mb-3">
        Meet Our Healers
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
        Experienced, verified practitioners ready to guide your healing journey.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healers.map((healer) => (
          <Link key={healer.id} href={`/healers/${healer.id}`}>
            <Card className="hover:shadow-lg hover:border-primary/40 transition-all group h-full">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="w-16 h-16 mb-3">
                  <AvatarImage src={healer.user.image || ""} />
                  <AvatarFallback className="text-lg">
                    {healer.user.name?.charAt(0).toUpperCase() || "H"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {healer.user.name}
                </h3>
                <div className="flex items-center gap-1 mt-1 mb-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium">
                    {healer.rating?.toFixed(1) ?? "New"}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    · {healer.experienceYears}y exp
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {healer.specializations.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="text-center mt-10">
        <Button asChild size="lg" variant="outline" className="focus-ring">
          <Link href="/healers">View All Healers</Link>
        </Button>
      </div>
    </section>
  )
}
