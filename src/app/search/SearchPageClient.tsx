'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface SearchResults {
  services: Array<{ id: string; slug: string; name: string; category: string; tagline: string | null }>
  healers: Array<{ id: string; bio: string | null; specializations: string[]; user: { name: string | null; image: string | null } }>
  programs: Array<{ id: string; slug: string; title: string; pricePaise: number }>
  courses: Array<{ id: string; slug: string; title: string; pricePaise: number; imageUrl: string | null }>
  products: Array<{ id: string; slug: string; title: string; pricePaise: number; imageUrl: string | null }>
  blog: Array<{ id: string; slug: string; title: string; excerpt: string | null; createdAt: string }>
  audio: Array<{ id: string; slug: string; title: string; category: string; duration: number; isPremium: boolean }>
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SearchPageClient() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(setResults)
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [q])

  const totalResults = results
    ? results.services.length +
      results.healers.length +
      results.programs.length +
      results.courses.length +
      results.products.length +
      results.blog.length +
      results.audio.length
    : 0

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-2">Search Results</h1>
      {q && (
        <p className="text-muted-foreground mb-6">
          {loading ? 'Searching...' : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${q}"`}
        </p>
      )}

      {!q && <p className="text-muted-foreground">Enter a search term to get started.</p>}

      {results && !loading && totalResults === 0 && (
        <p className="text-muted-foreground">No results found. Try a different search term.</p>
      )}

      {results && (
        <div className="space-y-8">
          {results.services.length > 0 && (
            <Section title="Services">
              {results.services.map((s) => (
                <ResultCard key={s.id} href={`/services/${s.slug}`} title={s.name} subtitle={s.tagline || s.category} />
              ))}
            </Section>
          )}

          {results.healers.length > 0 && (
            <Section title="Healers">
              {results.healers.map((h) => (
                <ResultCard
                  key={h.id}
                  href={`/healers/${h.id}`}
                  title={h.user.name || 'Healer'}
                  subtitle={h.specializations.length > 0 ? h.specializations.join(', ') : h.bio?.slice(0, 100) || undefined}
                />
              ))}
            </Section>
          )}

          {results.programs.length > 0 && (
            <Section title="Programs">
              {results.programs.map((p) => (
                <ResultCard key={p.id} href={`/programs/${p.slug}`} title={p.title} subtitle={`₹${(p.pricePaise / 100).toFixed(2)}`} />
              ))}
            </Section>
          )}

          {results.courses.length > 0 && (
            <Section title="Courses">
              {results.courses.map((c) => (
                <ResultCard key={c.id} href={`/courses/${c.slug}`} title={c.title} subtitle={`₹${(c.pricePaise / 100).toFixed(2)}`} />
              ))}
            </Section>
          )}

          {results.products.length > 0 && (
            <Section title="Products">
              {results.products.map((p) => (
                <ResultCard key={p.id} href={`/store/${p.slug}`} title={p.title} subtitle={`₹${(p.pricePaise / 100).toFixed(2)}`} />
              ))}
            </Section>
          )}

          {results.blog.length > 0 && (
            <Section title="Blog">
              {results.blog.map((b) => (
                <ResultCard key={b.id} href={`/blog/${b.slug}`} title={b.title} subtitle={b.excerpt || undefined} />
              ))}
            </Section>
          )}

          {results.audio.length > 0 && (
            <Section title="Audio">
              {results.audio.map((a) => (
                <ResultCard
                  key={a.id}
                  href={`/audio/${a.slug}`}
                  title={a.title}
                  subtitle={`${a.category} · ${formatDuration(a.duration)}${a.isPremium ? ' · Premium' : ''}`}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="grid gap-2">{children}</div>
    </div>
  )
}

function ResultCard({ href, title, subtitle }: { href: string; title: string; subtitle?: string }) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="py-3">
          <p className="font-medium">{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}
