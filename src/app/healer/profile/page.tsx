"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import AvatarUpload from "@/components/dashboard/AvatarUpload"
import { useSession } from "next-auth/react"

const profileSchema = z.object({
  bio: z.string().max(2000).optional().or(z.literal("")),
  experienceYears: z.number().int().min(0).max(100),
  specializations: z.string(), // comma-separated, split on save
})

type ProfileFormData = z.infer<typeof profileSchema>

interface HealerProfile {
  id: string
  bio: string | null
  experienceYears: number
  certifications: Record<string, unknown>[] | null
  specializations: string[]
  availability: unknown
  isActive: boolean
  isVerified: boolean
  rating: number
  user: { name: string | null; email: string; image: string | null; phone: string | null }
}

export default function HealerProfilePage() {
  const { update: updateSession } = useSession()
  const [profile, setProfile] = useState<HealerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [certs, setCerts] = useState<string[]>([])
  const [newCert, setNewCert] = useState("")

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { bio: "", experienceYears: 0, specializations: "" },
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/healer/profile")
        if (!res.ok) throw new Error()
        const { data } = await res.json() as { data: HealerProfile }
        setProfile(data)
        form.reset({
          bio: data.bio || "",
          experienceYears: data.experienceYears,
          specializations: data.specializations.join(", "),
        })
        // Flatten certifications to name strings for simple editing
        const certNames = (data.certifications || []).map(
          (c) => (c.name as string) || JSON.stringify(c),
        )
        setCerts(certNames)
      } catch {
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addCert = () => {
    const name = newCert.trim()
    if (!name) return
    if (certs.includes(name)) {
      toast.error("Certification already added")
      return
    }
    setCerts((prev) => [...prev, name])
    setNewCert("")
  }

  const removeCert = (name: string) => {
    setCerts((prev) => prev.filter((c) => c !== name))
  }

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    try {
      const specializations = data.specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const certifications = certs.map((name) => ({ name }))

      const res = await fetch("/api/healer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: data.bio || null,
          experienceYears: data.experienceYears,
          specializations,
          certifications,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Update failed")
      }

      toast.success("Profile updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUploaded = async () => {
    await updateSession()
  }

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Healer Profile</h1>

      {/* Status badges */}
      <div className="flex gap-2">
        <Badge variant={profile.isVerified ? "default" : "outline"}>
          {profile.isVerified ? "Verified" : "Unverified"}
        </Badge>
        <Badge variant={profile.isActive ? "default" : "secondary"}>
          {profile.isActive ? "Active" : "Inactive"}
        </Badge>
        {profile.rating > 0 && (
          <Badge variant="secondary">★ {profile.rating.toFixed(1)}</Badge>
        )}
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Click to upload a new avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentImage={profile.user.image || ""}
            name={profile.user.name || ""}
            onUploaded={handleAvatarUploaded}
          />
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Update your professional bio, experience, and specializations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Tell clients about your healing practice…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specializations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specializations</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Reiki, Sound Healing, Meditation (comma-separated)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Certifications */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Certifications</label>
                <div className="flex flex-wrap gap-2">
                  {certs.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1">
                      {c}
                      <button
                        type="button"
                        onClick={() => removeCert(c)}
                        className="ml-1 text-xs hover:text-destructive"
                        aria-label={`Remove ${c}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Add certification…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCert()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addCert}>
                    Add
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
