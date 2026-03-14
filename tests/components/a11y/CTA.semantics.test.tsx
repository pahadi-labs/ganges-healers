import { render, screen } from '@testing-library/react'
import ProgramEnrollSoon from '@/components/features/programs/ProgramEnrollSoon'
import ProductCtaAnalytics from '@/app/store/[slug]/product-cta-analytics'

jest.mock('@/lib/analytics/client', () => ({ track: jest.fn() }))
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'u1', email: 'a@b.com', name: 'Test' } } }),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

describe('CTA semantics', () => {
  it('ProgramEnrollSoon uses a button for in-place action', () => {
    render(<ProgramEnrollSoon programSlug="p1" programTitle="Test" pricePaise={10000} serviceSlug="svc1" />)
    const btn = screen.getByRole('button', { name: /enroll now/i })
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('Product CTA uses anchor for navigation', () => {
    render(
      <ProductCtaAnalytics productSlug="prod" serviceSlug="svc" href="/services/svc">
        View service
      </ProductCtaAnalytics>
    )
    const link = screen.getByRole('link', { name: /view service/i })
    expect(link).toHaveAttribute('href', '/services/svc')
  })
})
