import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  user: { name: string | null }
}

interface ReviewsSectionProps {
  reviews: Review[]
  avgRating: number | null
  totalCount: number
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`}
        />
      ))}
    </span>
  )
}

export default function ReviewsSection({ reviews, avgRating, totalCount }: ReviewsSectionProps) {
  if (totalCount === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        {avgRating !== null && (
          <div className="flex items-center gap-2">
            <StarDisplay rating={Math.round(avgRating)} />
            <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({totalCount} {totalCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{r.user.name ?? "Anonymous"}</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  Verified Session
                </Badge>
              </div>
              <StarDisplay rating={r.rating} />
            </div>
            {r.comment && (
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
