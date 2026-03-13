import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

async function guardAdmin() {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/')
  return session
}

async function createCourse(formData: FormData) {
  'use server'
  await guardAdmin()
  const title = String(formData.get('title'))
  const slug = String(formData.get('slug'))
  const description = String(formData.get('description'))
  const pricePaise = parseInt(String(formData.get('pricePaise') || '0'), 10)
  const imageUrl = String(formData.get('imageUrl') || '') || null

  await prisma.course.create({
    data: { title, slug, description, pricePaise, imageUrl },
  })
  revalidatePath('/admin/courses')
}

async function updateCourse(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  const title = String(formData.get('title'))
  const description = String(formData.get('description'))
  const pricePaise = parseInt(String(formData.get('pricePaise') || '0'), 10)
  const imageUrl = String(formData.get('imageUrl') || '') || null

  await prisma.course.update({
    where: { id },
    data: { title, description, pricePaise, imageUrl },
  })
  revalidatePath('/admin/courses')
}

async function toggleCourse(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  const current = String(formData.get('isActive')) === 'true'
  await prisma.course.update({ where: { id }, data: { isActive: !current } })
  revalidatePath('/admin/courses')
}

async function deleteCourse(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  await prisma.course.delete({ where: { id } })
  revalidatePath('/admin/courses')
}

export default async function AdminCoursesPage() {
  await guardAdmin()

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { lessons: true, enrollments: true } },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Admin · Courses</h1>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-medium mb-3">Create Course</h2>
          <form action={createCourse} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="new-title">Title</Label>
              <Input id="new-title" name="title" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="new-slug">Slug</Label>
              <Input id="new-slug" name="slug" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="new-price">Price (paise)</Label>
              <Input id="new-price" name="pricePaise" type="number" min="0" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="new-image">Image URL</Label>
              <Input id="new-image" name="imageUrl" />
            </div>
            <div className="md:col-span-2 grid gap-1">
              <Label htmlFor="new-desc">Description</Label>
              <textarea id="new-desc" name="description" required className="min-h-[60px] rounded-md border px-3 py-2 bg-background text-sm" />
            </div>
            <div>
              <Button type="submit" size="sm">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 divide-y">
          {courses.map((c) => (
            <div key={c.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">
                    {c.title}
                    {!c.isActive && <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{c.slug} · ₹{(c.pricePaise / 100).toFixed(2)} · {c._count.lessons} lessons · {c._count.enrollments} enrolled
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={toggleCourse}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="isActive" value={String(c.isActive)} />
                    <Button type="submit" variant="outline" size="sm">
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </form>
                  <form action={deleteCourse}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" variant="destructive" size="sm">Delete</Button>
                  </form>
                </div>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-primary">Edit</summary>
                <form action={updateCourse} className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid gap-1">
                    <Label>Title</Label>
                    <Input name="title" defaultValue={c.title} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Price (paise)</Label>
                    <Input name="pricePaise" type="number" defaultValue={c.pricePaise} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Image URL</Label>
                    <Input name="imageUrl" defaultValue={c.imageUrl ?? ''} />
                  </div>
                  <div className="md:col-span-3 grid gap-1">
                    <Label>Description</Label>
                    <textarea name="description" defaultValue={c.description} required className="min-h-[60px] rounded-md border px-3 py-2 bg-background text-sm" />
                  </div>
                  <div>
                    <Button type="submit" size="sm">Save</Button>
                  </div>
                </form>
              </details>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">No courses yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
