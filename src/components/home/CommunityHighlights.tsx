import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Heart, Users } from "lucide-react"
import Link from "next/link"

export default async function CommunityHighlights() {
  const posts = await prisma.communityPost.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      topic: { select: { name: true } },
      user: { select: { name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  if (posts.length === 0) return null

  return (
    <section className="py-16">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Users className="h-6 w-6 text-primary" />
        <h2 className="text-3xl font-bold text-center">
          From the Community
        </h2>
      </div>
      <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
        See what fellow seekers are sharing, discussing, and discovering
        together.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.id} href={`/community/post/${post.id}`}>
            <Card className="hover:shadow-lg hover:border-primary/40 transition-all group h-full">
              <CardContent className="py-6">
                {post.topic && (
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {post.topic.name}
                  </Badge>
                )}
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>by {post.user.name ?? "Anonymous"}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {post._count.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post._count.comments}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="text-center mt-10">
        <Button asChild size="lg" variant="outline" className="focus-ring">
          <Link href="/community">Join the Community</Link>
        </Button>
      </div>
    </section>
  )
}
