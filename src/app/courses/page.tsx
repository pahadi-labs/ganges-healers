import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import EmptyState from '@/components/empty/EmptyState'

export const metadata: Metadata = {
  title: 'Courses | Ganges Healers',
  description: 'Learn healing practices through our self-paced video courses.',
}

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lessons: true } } },
  })

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Courses</h1>

      {courses.length === 0 ? (
        <EmptyState
          title="No courses available"
          subtitle="Check back soon — new courses are being added."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="block rounded border p-4 hover:shadow-sm focus-ring"
            >
              {c.imageUrl && (
                <Image
                  src={c.imageUrl}
                  alt={c.title}
                  width={400}
                  height={160}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              )}
              <div className="font-medium text-lg">{c.title}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {c.description}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {c._count.lessons} lesson{c._count.lessons !== 1 ? 's' : ''}
              </div>
              <div className="mt-1 font-semibold">₹{(c.pricePaise / 100).toFixed(2)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
