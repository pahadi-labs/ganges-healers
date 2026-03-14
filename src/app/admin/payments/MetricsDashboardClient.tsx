'use client'

import dynamic from 'next/dynamic'

const MetricsDashboard = dynamic(() => import('./ui/MetricsDashboard'), {
  ssr: false,
  loading: () => <div className="p-8 text-muted-foreground">Loading metrics...</div>,
})

export default function MetricsDashboardClient() {
  return <MetricsDashboard />
}
