'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface TrackData {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  audioUrl: string | null
  duration: number
  isPremium: boolean
  locked: boolean
  reason?: string
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayerClient({ slug }: { slug: string }) {
  const { status } = useSession()
  const [track, setTrack] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/audio/${encodeURIComponent(slug)}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Track not found')
          return
        }
        setTrack(await res.json())
      } catch {
        setError('Failed to load track')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !track) {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <h1 className="text-xl font-semibold mb-2">Track Not Found</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/audio">← Back to Audio Library</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Link href="/audio" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
        ← Back to Audio Library
      </Link>

      <h1 className="text-3xl font-bold mb-2">{track.title}</h1>
      <p className="text-muted-foreground mb-1">
        {track.category} · {formatDuration(track.duration)}
        {track.isPremium && (
          <span className="ml-2 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
            Premium
          </span>
        )}
      </p>

      {track.description && (
        <p className="text-muted-foreground mt-4 mb-6 whitespace-pre-line">{track.description}</p>
      )}

      {track.locked ? (
        <Card className="mt-6">
          <CardContent className="py-8 text-center space-y-3">
            <p className="font-medium">🔒 Premium Content</p>
            <p className="text-sm text-muted-foreground">{track.reason}</p>
            {status !== 'authenticated' ? (
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/membership">Upgrade to VIP</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio
            controls
            src={track.audioUrl!}
            className="w-full"
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  )
}
