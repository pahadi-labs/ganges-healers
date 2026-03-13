import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import EmptyState from '@/components/empty/EmptyState'

export const metadata: Metadata = {
  title: 'Audio Library | Ganges Healers',
  description: 'Guided meditations, healing sounds, and wellness audio tracks.',
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default async function AudioLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [tracks, categoriesRaw] = await Promise.all([
    prisma.audioTrack.findMany({
      where: category ? { category } : {},
      orderBy: { createdAt: 'desc' },
    }),
    prisma.audioTrack.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ])

  const categories = categoriesRaw.map((c) => c.category)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Audio Library</h1>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/audio"
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              !category ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/audio?category=${encodeURIComponent(cat)}`}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                category === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {tracks.length === 0 ? (
        <EmptyState
          title="No audio tracks available"
          subtitle="Check back soon — new tracks are being added."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <Link
              key={track.id}
              href={`/audio/${track.slug}`}
              className="block rounded border p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-lg truncate">{track.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {track.category} · {formatDuration(track.duration)}
                  </div>
                  {track.description && (
                    <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {track.description}
                    </div>
                  )}
                </div>
                {track.isPremium && (
                  <span className="shrink-0 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Premium
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
