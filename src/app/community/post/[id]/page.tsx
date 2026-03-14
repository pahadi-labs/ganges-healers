"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2, Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
}

interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
  comments: Comment[]
  _count: { likes: number }
  liked: boolean
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [commenting, setCommenting] = useState(false)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/community/posts/${params.id}`)
        if (!res.ok) throw new Error()
        const { data } = await res.json()
        setPost(data)
      } catch {
        toast.error("Failed to load post")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const handleLike = async () => {
    if (!post || liking) return
    setLiking(true)
    try {
      const res = await fetch("/api/community/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed")
      }
      const { liked } = await res.json()
      setPost((prev) =>
        prev
          ? {
              ...prev,
              liked,
              _count: {
                ...prev._count,
                likes: prev._count.likes + (liked ? 1 : -1),
              },
            }
          : prev,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLiking(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !post) return

    setCommenting(true)
    try {
      const res = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, content: comment.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to comment")
      }
      const { data } = await res.json()
      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data] } : prev,
      )
      setComment("")
      toast.success("Comment added")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to comment")
    } finally {
      setCommenting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto p-6 max-w-3xl text-center">
        <p className="text-muted-foreground">Post not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/community">Back to Community</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/community">← Back</Link>
      </Button>

      {/* Post */}
      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user.image || ""} />
              <AvatarFallback>
                {post.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.user.name || "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <h1 className="text-xl font-bold">{post.title}</h1>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

          <div className="flex items-center gap-4 pt-2">
            <Button
              variant={post.liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={liking}
            >
              <Heart className={`w-4 h-4 mr-1 ${post.liked ? "fill-current" : ""}`} />
              {post._count.likes}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Comments ({post.comments.length})
        </h2>

        {post.comments.map((c) => (
          <Card key={c.id}>
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-7 h-7 mt-0.5">
                  <AvatarImage src={c.user.image || ""} />
                  <AvatarFallback className="text-xs">
                    {c.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.user.name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add comment */}
        <Card>
          <CardContent className="py-4">
            <form onSubmit={handleComment} className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                maxLength={2000}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="submit" size="sm" disabled={commenting || !comment.trim()}>
                {commenting ? "Posting…" : "Post Comment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
