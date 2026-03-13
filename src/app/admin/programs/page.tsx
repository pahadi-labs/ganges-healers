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

async function createProgram(formData: FormData) {
  'use server'
  await guardAdmin()
  const title = String(formData.get('title'))
  const slug = String(formData.get('slug'))
  const description = String(formData.get('description'))
  const pricePaise = parseInt(String(formData.get('pricePaise') || '0'), 10)
  const totalSessions = parseInt(String(formData.get('totalSessions') || '1'), 10)
  const sessionsPerWeek = parseInt(String(formData.get('sessionsPerWeek') || '1'), 10)
  const durationMinutes = parseInt(String(formData.get('durationMinutes') || '60'), 10)

  await prisma.program.create({
    data: { title, slug, description, pricePaise, totalSessions, sessionsPerWeek, durationMinutes },
  })
  revalidatePath('/admin/programs')
}

async function updateProgram(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  const title = String(formData.get('title'))
  const description = String(formData.get('description'))
  const pricePaise = parseInt(String(formData.get('pricePaise') || '0'), 10)
  const totalSessions = parseInt(String(formData.get('totalSessions') || '1'), 10)
  const sessionsPerWeek = parseInt(String(formData.get('sessionsPerWeek') || '1'), 10)
  const durationMinutes = parseInt(String(formData.get('durationMinutes') || '60'), 10)

  await prisma.program.update({
    where: { id },
    data: { title, description, pricePaise, totalSessions, sessionsPerWeek, durationMinutes },
  })
  revalidatePath('/admin/programs')
}

async function toggleProgram(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  const current = String(formData.get('isActive')) === 'true'
  await prisma.program.update({ where: { id }, data: { isActive: !current } })
  revalidatePath('/admin/programs')
}

async function deleteProgram(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  await prisma.program.delete({ where: { id } })
  revalidatePath('/admin/programs')
}

export default async function AdminProgramsPage() {
  await guardAdmin()

  const programs = await prisma.program.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { enrollments: true } } },
  })

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Admin · Programs</h1>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-medium mb-3">Create Program</h2>
          <form action={createProgram} className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <Label htmlFor="new-total">Total Sessions</Label>
              <Input id="new-total" name="totalSessions" type="number" min="1" defaultValue="8" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="new-perweek">Sessions/Week</Label>
              <Input id="new-perweek" name="sessionsPerWeek" type="number" min="1" defaultValue="2" required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="new-dur">Duration (min)</Label>
              <Input id="new-dur" name="durationMinutes" type="number" min="1" defaultValue="60" required />
            </div>
            <div className="md:col-span-3 grid gap-1">
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
          {programs.map((p) => (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">
                    {p.title}
                    {!p.isActive && <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{p.slug} · ₹{(p.pricePaise / 100).toFixed(2)} · {p.totalSessions} sessions ({p.sessionsPerWeek}/wk, {p.durationMinutes}min) · {p._count.enrollments} enrolled
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={toggleProgram}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="isActive" value={String(p.isActive)} />
                    <Button type="submit" variant="outline" size="sm">
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </form>
                  <form action={deleteProgram}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="destructive" size="sm">Delete</Button>
                  </form>
                </div>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-primary">Edit</summary>
                <form action={updateProgram} className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <div className="grid gap-1">
                    <Label>Title</Label>
                    <Input name="title" defaultValue={p.title} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Price (paise)</Label>
                    <Input name="pricePaise" type="number" defaultValue={p.pricePaise} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Total Sessions</Label>
                    <Input name="totalSessions" type="number" defaultValue={p.totalSessions} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Sessions/Week</Label>
                    <Input name="sessionsPerWeek" type="number" defaultValue={p.sessionsPerWeek} required />
                  </div>
                  <div className="grid gap-1">
                    <Label>Duration (min)</Label>
                    <Input name="durationMinutes" type="number" defaultValue={p.durationMinutes} required />
                  </div>
                  <div className="md:col-span-3 grid gap-1">
                    <Label>Description</Label>
                    <textarea name="description" defaultValue={p.description} required className="min-h-[60px] rounded-md border px-3 py-2 bg-background text-sm" />
                  </div>
                  <div>
                    <Button type="submit" size="sm">Save</Button>
                  </div>
                </form>
              </details>
            </div>
          ))}
          {programs.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">No programs yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
