import { Card, CardContent } from "@/components/ui/card"
import { Users, Star, Headphones, Calendar } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function SocialProofSection() {
  const [healerCount, serviceCount, audioCount, communityCount] =
    await Promise.all([
      prisma.healer.count({ where: { isActive: true, isVerified: true } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.audioTrack.count(),
      prisma.communityPost.count({ where: { deletedAt: null } }),
    ])

  const stats = [
    {
      label: "Verified Healers",
      value: healerCount || "10+",
      icon: Users,
    },
    {
      label: "Healing Services",
      value: serviceCount || "20+",
      icon: Star,
    },
    {
      label: "Audio Tracks",
      value: audioCount || "50+",
      icon: Headphones,
    },
    {
      label: "Community Posts",
      value: communityCount || "100+",
      icon: Calendar,
    },
  ]

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold text-center mb-3">
        Trusted by a Growing Community
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
        Join thousands who have found healing, growth, and transformation
        through our platform.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center py-8">
              <stat.icon className="h-8 w-8 text-primary mb-3" />
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
