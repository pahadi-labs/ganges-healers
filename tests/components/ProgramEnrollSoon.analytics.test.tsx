import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ProgramEnrollSoon from '@/components/features/programs/ProgramEnrollSoon'

jest.mock('@/lib/analytics/client', () => ({
  track: jest.fn(),
}))
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'u1', email: 'a@b.com', name: 'Test' } } }),
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

const { track } = jest.requireMock('@/lib/analytics/client') as { track: jest.Mock }

describe('ProgramEnrollSoon analytics', () => {
  test('click fires program_enroll_click with expected payload', async () => {
    const user = userEvent.setup()
    // Use existing jsdom location and append a query for stability
    const originalHref = window.location.href
    window.history.pushState({}, '', '/programs/abc?ref=test')

    // Mock fetch to prevent actual API calls
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'test' }) }) as jest.Mock

    render(<ProgramEnrollSoon programSlug="abc" programTitle="Test Program" pricePaise={50000} serviceSlug="svc-1" />)

    const btn = screen.getByRole('button', { name: /enroll now/i })
    await user.click(btn)

    expect(track).toHaveBeenCalledTimes(1)
    const [event, props] = track.mock.calls[0]
    expect(event).toBe('program_enroll_click')
    expect(props).toMatchObject({ programSlug: 'abc', serviceSlug: 'svc-1' })
    expect(typeof props.ts).toBe('number')
    expect(props.path).toBe('/programs/abc?ref=test')
    // restore
    window.history.replaceState({}, '', originalHref)
  })
})
