import { getProgramBySlug } from '@/lib/programs/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProgramLd from '@/components/seo/ProgramLd'
import ProgramEnrollSoon from '@/components/features/programs/ProgramEnrollSoon'
import type { Metadata } from 'next'
import { canonicalOf } from '@/config/site'
import Breadcrumbs from '@/components/seo/Breadcrumbs'
import BreadcrumbsLd from '@/components/seo/BreadcrumbsLd'
import { makeProgramCrumbs } from '@/lib/seo/breadcrumbs'
import { Clock, CalendarDays, Layers, Repeat } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await getProgramBySlug(slug)
  if (!p) return {}
  return {
    title: `${p.title} | Healing Program | Ganges Healers`,
    description: p.shortDescription,
    alternates: { canonical: canonicalOf(`/programs/${p.slug}`) },
    openGraph: { title: p.title, description: p.shortDescription, url: canonicalOf(`/programs/${p.slug}`) },
    twitter: { card: 'summary_large_image', title: p.title, description: p.shortDescription },
  }
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getProgramBySlug(slug)
  if (!p) return notFound()
  const crumbs = makeProgramCrumbs(slug, p.title)
  const totalWeeks = p.sessionsPerWeek > 0 ? Math.ceil(p.sessionsCount / p.sessionsPerWeek) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <Breadcrumbs crumbs={crumbs} />
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{p.title}</h1>
          <p className="text-lg text-emerald-100 mt-2 max-w-2xl">{p.shortDescription}</p>
          <div className="mt-4 text-2xl font-bold">₹{(p.pricePaise / 100).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <BreadcrumbsLd crumbs={crumbs} />
        <ProgramLd program={p} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Program Structure */}
            <Card>
              <CardHeader>
                <CardTitle>Program Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-emerald-50">
                    <Layers className="w-6 h-6 text-emerald-600 mb-2" />
                    <span className="text-2xl font-bold text-emerald-700">{p.sessionsCount}</span>
                    <span className="text-sm text-gray-600">Total Sessions</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-emerald-50">
                    <Repeat className="w-6 h-6 text-emerald-600 mb-2" />
                    <span className="text-2xl font-bold text-emerald-700">{p.sessionsPerWeek}</span>
                    <span className="text-sm text-gray-600">Per Week</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-emerald-50">
                    <Clock className="w-6 h-6 text-emerald-600 mb-2" />
                    <span className="text-2xl font-bold text-emerald-700">{p.durationMinutes}</span>
                    <span className="text-sm text-gray-600">Min / Session</span>
                  </div>
                  {totalWeeks && (
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-emerald-50">
                      <CalendarDays className="w-6 h-6 text-emerald-600 mb-2" />
                      <span className="text-2xl font-bold text-emerald-700">{totalWeeks}</span>
                      <span className="text-sm text-gray-600">Week{totalWeeks !== 1 ? 's' : ''} Total</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* About This Program */}
            <Card>
              <CardHeader>
                <CardTitle>About This Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none whitespace-pre-wrap">{p.longDescription}</div>
              </CardContent>
            </Card>

            {/* Service cross-sell (if linked) */}
            {p.serviceSlug && (
              <Card>
                <CardHeader>
                  <CardTitle>Try a Single Session First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Not sure if this program is right for you? Book an introductory session to experience the healing modality firsthand.
                  </p>
                  <Link href={`/services/${p.serviceSlug}?openBooking=1&programSlug=${encodeURIComponent(p.slug)}`}>
                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                      Book an Introductory Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar — Enrollment */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enroll in This Program</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold text-emerald-600">
                    ₹{(p.pricePaise / 100).toLocaleString('en-IN')}
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ {p.sessionsCount} guided sessions</li>
                    <li>✓ {p.sessionsPerWeek} session{p.sessionsPerWeek !== 1 ? 's' : ''} per week</li>
                    <li>✓ {p.durationMinutes} minutes per session</li>
                    {totalWeeks && <li>✓ Complete in {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}</li>}
                  </ul>
                  <ProgramEnrollSoon
                    programSlug={p.slug}
                    programTitle={p.title}
                    pricePaise={p.pricePaise}
                    serviceSlug={p.serviceSlug ?? undefined}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
