"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Topic {
  id: string
  slug: string
  name: string
  description: string | null
}

interface Tag {
  id: string
  slug: string
  name: string
}

const WRITING_PROMPTS = [
  "Share your healing journey — what has transformed for you?",
  "What insight helped you recently?",
  "What challenge are you working through right now?",
  "Describe a meditation or healing experience that moved you.",
  "What practice has made the biggest difference in your life?",
]

export default function CreatePostPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedTopicId, setSelectedTopicId] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/community/topics").then((r) => r.json()),
      fetch("/api/community/tags").then((r) => r.json()),
    ])
      .then(([topicsRes, tagsRes]) => {
        if (topicsRes.data) setTopics(topicsRes.data)
        if (tagsRes.data) setTags(tagsRes.data)
      })
      .catch(() => {})
  }, [])

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : prev.length < 5
          ? [...prev, tagId]
          : prev,
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          topicId: selectedTopicId || undefined,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create post")
      }

      const { data } = await res.json()
      toast.success("Post created!")
      router.push(`/community/post/${data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create post")
    } finally {
      setSaving(false)
    }
  }

  // Pick a random writing prompt
  const [prompt] = useState(
    () => WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)],
  )

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-4">
      {/* Writing Prompt */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <p className="text-sm text-primary italic">&ldquo;{prompt}&rdquo;</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>Share your thoughts with the community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Topic Selection */}
            {topics.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select a topic (optional)</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post…"
                maxLength={5000}
                className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Tags Selection */}
            {tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tags <span className="text-muted-foreground font-normal">(up to 5)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Publishing…" : "Publish"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
