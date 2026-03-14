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

async function createProduct(formData: FormData) {
  'use server'
  await guardAdmin()
  const title = String(formData.get('title'))
  const slug = String(formData.get('slug'))
  const shortDescription = String(formData.get('shortDescription') || '')
  const longDescription = String(formData.get('longDescription') || '')
  const pricePaise = parseInt(String(formData.get('pricePaise') || '0'), 10)
  const imageUrl = String(formData.get('imageUrl') || '') || null
  const stockStatus = String(formData.get('stockStatus') || 'IN_STOCK')

  await prisma.product.create({
    data: { title, slug, shortDescription, longDescription, pricePaise, imageUrl, stockStatus },
  })
  revalidatePath('/admin/products')
}

async function updateProduct(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  const title = String(formData.get('title'))
  const shortDescription = String(formData.get('shortDescription') || '')
  const longDescription = String(formData.get('longDescription') || '')
  const pricePaise = parseInt(String(formData.get('pricePaise') || '0'), 10)
  const imageUrl = String(formData.get('imageUrl') || '') || null
  const stockStatus = String(formData.get('stockStatus') || 'IN_STOCK')

  await prisma.product.update({
    where: { id },
    data: { title, shortDescription, longDescription, pricePaise, imageUrl, stockStatus },
  })
  revalidatePath('/admin/products')
}

async function toggleProduct(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  const current = String(formData.get('isActive')) === 'true'
  await prisma.product.update({ where: { id }, data: { isActive: !current } })
  revalidatePath('/admin/products')
}

async function deleteProduct(formData: FormData) {
  'use server'
  await guardAdmin()
  const id = String(formData.get('id'))
  await prisma.product.delete({ where: { id } })
  revalidatePath('/admin/products')
}

export default async function AdminProductsPage() {
  await guardAdmin()

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { title: true } },
      _count: { select: { orderItems: true } },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Admin · Products</h1>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-medium mb-3">Create Product</h2>
          <form action={createProduct} className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <div className="grid gap-1">
              <Label htmlFor="new-stock">Stock Status</Label>
              <select id="new-stock" name="stockStatus" className="h-9 rounded-md border px-2 bg-background" defaultValue="IN_STOCK">
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW">Low Stock</option>
                <option value="OUT">Out of Stock</option>
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="new-short">Short Description</Label>
              <Input id="new-short" name="shortDescription" />
            </div>
            <div className="md:col-span-3 grid gap-1">
              <Label htmlFor="new-long">Long Description</Label>
              <textarea id="new-long" name="longDescription" className="min-h-[60px] rounded-md border px-3 py-2 bg-background text-sm" />
            </div>
            <div>
              <Button type="submit" size="sm">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 divide-y">
          {products.map((p) => (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">
                    {p.title}
                    {!p.isActive && <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{p.slug} · ₹{(p.pricePaise / 100).toFixed(2)} · {p.stockStatus} · {p.category?.title || 'No category'} · {p._count.orderItems} orders
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="isActive" value={String(p.isActive)} />
                    <Button type="submit" variant="outline" size="sm">
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </form>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="destructive" size="sm">Delete</Button>
                  </form>
                </div>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-primary">Edit</summary>
                <form action={updateProduct} className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
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
                    <Label>Stock Status</Label>
                    <select name="stockStatus" className="h-9 rounded-md border px-2 bg-background" defaultValue={p.stockStatus}>
                      <option value="IN_STOCK">In Stock</option>
                      <option value="LOW">Low Stock</option>
                      <option value="OUT">Out of Stock</option>
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Image URL</Label>
                    <Input name="imageUrl" defaultValue={p.imageUrl ?? ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label>Short Description</Label>
                    <Input name="shortDescription" defaultValue={p.shortDescription} />
                  </div>
                  <div className="md:col-span-3 grid gap-1">
                    <Label>Long Description</Label>
                    <textarea name="longDescription" defaultValue={p.longDescription} className="min-h-[60px] rounded-md border px-3 py-2 bg-background text-sm" />
                  </div>
                  <div>
                    <Button type="submit" size="sm">Save</Button>
                  </div>
                </form>
              </details>
            </div>
          ))}
          {products.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">No products yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
