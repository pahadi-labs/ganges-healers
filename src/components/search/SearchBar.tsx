'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Link from 'next/link'

interface Suggestion {
  type: string
  id: string
  slug: string
  label: string
  href: string
}

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const items: Suggestion[] = []

      for (const s of data.services?.slice(0, 3) ?? []) {
        items.push({ type: 'Service', id: s.id, slug: s.slug, label: s.name, href: `/services/${s.slug}` })
      }
      for (const h of data.healers?.slice(0, 3) ?? []) {
        items.push({ type: 'Healer', id: h.id, slug: h.id, label: h.user?.name || 'Healer', href: `/healers/${h.id}` })
      }
      for (const p of data.programs?.slice(0, 3) ?? []) {
        items.push({ type: 'Program', id: p.id, slug: p.slug, label: p.title, href: `/programs/${p.slug}` })
      }
      for (const c of data.courses?.slice(0, 3) ?? []) {
        items.push({ type: 'Course', id: c.id, slug: c.slug, label: c.title, href: `/courses/${c.slug}` })
      }

      setSuggestions(items)
      setOpen(items.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchSuggestions])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      setOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length >= 2) setOpen(true)
            }}
            onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
            placeholder="Search..."
            className="h-8 w-40 md:w-56 rounded-md border bg-background pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Search platform"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setOpen(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-72 rounded-md border bg-background shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((s) => (
            <Link
              key={`${s.type}-${s.id}`}
              href={s.href}
              onClick={() => { setOpen(false); setQuery('') }}
              className="flex items-center justify-between px-3 py-2 hover:bg-muted text-sm transition-colors"
            >
              <span className="truncate">{s.label}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{s.type}</span>
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-primary hover:bg-muted border-t"
          >
            {loading ? 'Searching...' : `View all results for "${query}"`}
          </Link>
        </div>
      )}
    </div>
  )
}
