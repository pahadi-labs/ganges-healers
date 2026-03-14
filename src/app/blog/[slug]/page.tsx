import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { format } from 'date-fns'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findFirst({
    where: { OR: [{ id: slug }, { slug }], published: true },
  })
  if (!post) return { title: 'Post Not Found' }
  return {
    title: `${post.title} | Blog | Ganges Healers`,
    description: post.excerpt || post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.slice(0, 160),
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      ...(post.imageUrl ? { images: [{ url: post.imageUrl }] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await prisma.blogPost.findFirst({
    where: { OR: [{ id: slug }, { slug }], published: true },
  })

  if (!post) notFound()

  return (
    <article className="container mx-auto p-6 max-w-3xl">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
        ← Back to Blog
      </Link>

      {post.imageUrl && (
        <Image
          src={post.imageUrl}
          alt={post.title}
          width={800}
          height={400}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}

      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Published {format(new Date(post.createdAt), 'dd MMMM yyyy')}
      </p>

      <div className="prose prose-neutral max-w-none whitespace-pre-line">
        {post.content}
      </div>
    </article>
  )
}
