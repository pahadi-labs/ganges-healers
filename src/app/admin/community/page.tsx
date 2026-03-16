"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Shield, BarChart3, CheckCircle, XCircle } from "lucide-react"

interface ReportTarget {
  id: string
  title?: string
  content?: string
  userId: string
  deletedAt: string | null
  user: { name: string | null }
}

interface Report {
  id: string
  userId: string
  targetType: string
  targetId: string
  reason: string
  status: string
  createdAt: string
  user: { id: string; name: string | null; email: string }
  reviewer: { id: string; name: string | null } | null
  target: ReportTarget | null
}

interface Metrics {
  totalPosts: number
  postsToday: number
  postsThisWeek: number
  totalComments: number
  commentsThisWeek: number
  avgCommentsPerPost: number
  totalUsers: number
  activeContributorsThisWeek: number
  vipParticipants: number
}

export default function AdminCommunityPage() {
  const [view, setView] = useState<"reports" | "metrics">("reports")
  const [reports, setReports] = useState<Report[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [actioning, setActioning] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (view === "reports") {
        const res = await fetch(`/api/admin/community?view=reports&status=${statusFilter}`)
        if (!res.ok) throw new Error()
        const json = await res.json()
        setReports(json.data)
        setPendingCount(json.pendingCount)
      } else {
        const res = await fetch("/api/admin/community?view=metrics")
        if (!res.ok) throw new Error()
        const json = await res.json()
        setMetrics(json.data)
      }
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [view, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (reportId: string, action: "reviewed" | "dismissed") => {
    setActioning(reportId)
    try {
      const res = await fetch("/api/admin/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(action === "reviewed" ? "Content removed & report resolved" : "Report dismissed")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin · Community</h1>
        <div className="flex gap-2">
          <Button
            variant={view === "reports" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("reports")}
          >
            <Shield className="w-4 h-4 mr-1" /> Moderation
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
            )}
          </Button>
          <Button
            variant={view === "metrics" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("metrics")}
          >
            <BarChart3 className="w-4 h-4 mr-1" /> Metrics
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "reports" ? (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2">
            {(["pending", "reviewed", "dismissed"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No {statusFilter} reports.
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.targetType === "post" ? "default" : "secondary"}>
                        {report.targetType}
                      </Badge>
                      <Badge variant="outline">{report.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Reported by:</span>{" "}
                    {report.user.name || report.user.email}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Reason:</span> {report.reason}
                  </div>

                  {report.target && (
                    <div className="bg-muted/50 rounded-md p-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">
                        Content by {report.target.user?.name || "Unknown"}
                        {report.target.deletedAt && " (already deleted)"}
                      </p>
                      {report.target.title && (
                        <p className="font-medium">{report.target.title}</p>
                      )}
                      <p className="line-clamp-3">{report.target.content}</p>
                    </div>
                  )}

                  {report.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actioning === report.id}
                        onClick={() => handleAction(report.id, "reviewed")}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Remove Content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actioning === report.id}
                        onClick={() => handleAction(report.id, "dismissed")}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Metrics View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics && (
            <>
              <MetricCard title="Total Posts" value={metrics.totalPosts} />
              <MetricCard title="Posts Today" value={metrics.postsToday} />
              <MetricCard title="Posts This Week" value={metrics.postsThisWeek} />
              <MetricCard title="Total Comments" value={metrics.totalComments} />
              <MetricCard title="Comments This Week" value={metrics.commentsThisWeek} />
              <MetricCard title="Avg Comments/Post" value={metrics.avgCommentsPerPost} />
              <MetricCard title="Total Users" value={metrics.totalUsers} />
              <MetricCard title="Active Contributors (7d)" value={metrics.activeContributorsThisWeek} />
              <MetricCard title="VIP Participants" value={metrics.vipParticipants} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
