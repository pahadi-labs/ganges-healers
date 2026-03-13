"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2, Heart, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
  _count: { comments: number; likes: number }
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPosts = useCallback(async (cursor?: string) => {
    const isMore = !!cursor
    if (isMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      if (cursor) params.set("cursor", cursor)
      const res = await fetch(`/api/community/posts?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setPosts((prev) => (isMore ? [...prev, ...json.data] : json.data))
      setNextCursor(json.nextCursor)
    } catch {
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Community</h1>
        <Button asChild>
          <Link href="/community/create">Create Post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No posts yet. Be the first to start a discussion!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link href={`/community/post/${post.id}`} key={post.id}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.user.image || ""} />
                      <AvatarFallback>
                        {post.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{post.user.name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold">{post.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> {post._count.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" /> {post._count.comments}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => fetchPosts(nextCursor)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}
