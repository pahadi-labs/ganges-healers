import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchPageClient from './SearchPageClient'

export const metadata: Metadata = {
  title: 'Search | Ganges Healers',
  description: 'Search across services, healers, programs, courses, products, blog, and audio.',
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <SearchPageClient />
    </Suspense>
  )
}
