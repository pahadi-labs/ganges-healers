import { requireAdmin } from '@/lib/rbac'
import MetricsDashboardClient from './MetricsDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  await requireAdmin()
  return <MetricsDashboardClient />
}