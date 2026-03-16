import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Check } from "lucide-react"
import Link from "next/link"

export default async function VIPMembershipSection() {
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { pricePaise: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      pricePaise: true,
      interval: true,
      benefits: true,
    },
  })

  if (plans.length === 0) return null

  return (
    <section className="py-16">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Crown className="h-6 w-6 text-primary" />
        <h2 className="text-3xl font-bold text-center">
          VIP Membership
        </h2>
      </div>
      <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
        Unlock premium audio, exclusive discounts, and priority bookings
        with a VIP membership.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const benefitList: string[] = Array.isArray(plan.benefits)
            ? (plan.benefits as string[])
            : []
          return (
            <Card
              key={plan.id}
              className="hover:shadow-lg hover:border-primary/40 transition-all"
            >
              <CardHeader className="text-center pb-2">
                <Badge variant="secondary" className="self-center mb-2">
                  {plan.interval === "YEARLY" ? "Best Value" : plan.interval}
                </Badge>
                <CardTitle className="text-xl">{plan.title}</CardTitle>
                <p className="text-3xl font-bold mt-2">
                  ₹{(plan.pricePaise / 100).toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.interval === "YEARLY" ? "year" : "month"}
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                {benefitList.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {benefitList.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild className="w-full focus-ring">
                  <Link href="/dashboard/membership">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
