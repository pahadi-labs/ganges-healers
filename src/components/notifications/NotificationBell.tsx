'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getSocket, disconnectSocket } from '@/lib/socket-client'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [usePolling, setUsePolling] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const addRealtimeNotification = useCallback(
    (n: { id: string; type: string; title: string; message: string; createdAt: string }) => {
      setNotifications((prev) => [{ ...n, read: false }, ...prev])
      setUnreadCount((c) => c + 1)
    },
    []
  )

  // Socket.IO connection — falls back to polling on failure
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    const socket = getSocket(userId)

    socket.on('notification', addRealtimeNotification)

    socket.on('connect_error', () => {
      // Socket unavailable (e.g. running on Vercel without custom server) — fall back to polling
      setUsePolling(true)
      disconnectSocket()
    })

    return () => {
      socket.off('notification', addRealtimeNotification)
      socket.off('connect_error')
    }
  }, [session?.user?.id, addRealtimeNotification])

  // Initial fetch + polling fallback
  useEffect(() => {
    fetchNotifications()
    if (!usePolling) return
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [usePolling])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch { /* ignore */ }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch { /* ignore */ }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-muted rounded focus-ring"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-md border bg-background shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-3 py-2 border-b font-medium text-sm">
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </div>

          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => { if (!n.read) markRead(n.id) }}
                className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-muted transition-colors ${
                  !n.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  </div>
                  {!n.read && (
                    <span className="shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
