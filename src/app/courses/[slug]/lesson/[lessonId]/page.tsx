import LessonPlayer from '@/components/courses/LessonPlayer'

interface Props {
  params: Promise<{ slug: string; lessonId: string }>
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params

  return <LessonPlayer courseSlug={slug} lessonId={lessonId} />
}
