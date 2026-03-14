"use client"

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { openRazorpayCheckout } from '@/lib/payments/openRazorpayCheckout'

interface CourseData {
  id: string
  slug: string
  title: string
  description: string
  pricePaise: number
  imageUrl: string | null
  lessons: { id: string; title: string; order: number }[]
  _count: { enrollments: number }
}

export default function CourseEnrollButton({ course }: { course: CourseData }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const verifyingRef = useRef(false)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/courses/enrollments/me`)
      .then(r => r.json())
      .then((data: { courseId: string }[]) => {
        if (Array.isArray(data) && data.some(e => e.courseId === course.id)) {
          setEnrolled(true)
        }
      })
      .catch(() => {})
  }, [session?.user?.id, course.id])

  if (enrolled) {
    return (
      <Button onClick={() => router.push(`/courses/${course.slug}/lesson/${course.lessons[0]?.id}`)}>
        Continue Learning
      </Button>
    )
  }

  async function handleEnroll() {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    setLoading(true)
    try {
      const enrollRes = await fetch(`/api/courses/${encodeURIComponent(course.slug)}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!enrollRes.ok) {
        const errData = await enrollRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Enrollment failed')
      }

      const { orderId, amountPaise, key } = await enrollRes.json()

      const result = await openRazorpayCheckout({
        orderId,
        amountPaise,
        key,
        prefill: { email: session.user.email || '', name: session.user.name || '' },
        description: `Course: ${course.title}`,
      })

      if (verifyingRef.current) return
      verifyingRef.current = true

      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: result.razorpay_order_id,
          paymentId: result.razorpay_payment_id,
          signature: result.razorpay_signature,
        }),
      })

      if (!verifyRes.ok) {
        const vErr = await verifyRes.json().catch(() => ({}))
        throw new Error(vErr.error || 'Payment verification failed')
      }

      setEnrolled(true)
      toast.success('Enrolled! Redirecting to course…')
      setTimeout(() => router.push(`/courses/${course.slug}/lesson/${course.lessons[0]?.id}`), 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (msg === 'Payment dismissed') {
        toast.error('Payment was cancelled. You can try again.')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
      verifyingRef.current = false
    }
  }

  return (
    <Button onClick={handleEnroll} disabled={loading}>
      {loading ? 'Processing…' : `Enroll — ₹${(course.pricePaise / 100).toFixed(2)}`}
    </Button>
  )
}
