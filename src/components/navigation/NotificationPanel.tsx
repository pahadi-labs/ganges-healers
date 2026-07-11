import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface NotificationItemData {
  /** Unique identifier for the notification. */
  id: string;
  /** Notification title. */
  title: string;
  /** Supporting message. */
  message: string;
  /** Relative time label. */
  time: string;
  /** Whether the notification has been read. */
  read?: boolean;
  /** Optional avatar fallback. */
  avatarFallback?: string;
}

export interface NotificationGroupData {
  /** Group title. */
  title: string;
  /** Items belonging to the group. */
  items: NotificationItemData[];
}

export interface NotificationPanelProps {
  /** Whether the panel is open. */
  open?: boolean;
  /** Callback for open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Groups to render. */
  groups?: NotificationGroupData[];
  /** Whether the panel shows a loading state. */
  loading?: boolean;
  /** Whether the panel shows an error state. */
  error?: boolean;
  /** Optional empty state content. */
  emptyState?: ReactNode;
  /** Optional loading state content. */
  loadingState?: ReactNode;
  /** Optional error state content. */
  errorState?: ReactNode;
  /** Optional label for the mark all as read action. */
  markAllAsReadLabel?: string;
  /** Optional label for the view all notifications action. */
  viewAllLabel?: string;
  /** Additional classes for the panel container. */
  className?: string;
}

/**
 * Presentational notification panel shell for Navigation V2.
 *
 * This component provides the reusable UI structure for grouped notifications,
 * loading, empty, and error states without introducing any runtime behavior.
 */
export function NotificationPanel({
  open = false,
  onOpenChange,
  groups = [],
  loading = false,
  error = false,
  emptyState,
  loadingState,
  errorState,
  markAllAsReadLabel = "Mark all as read",
  viewAllLabel = "View all notifications",
  className,
}: NotificationPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <Card
      className={cn(
        "w-[min(100vw-2rem,24rem)] border-border/60 bg-card shadow-lg sm:w-96",
        className,
      )}
      role="dialog"
      aria-label="Notifications"
    >
      <CardHeader className="gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Notifications</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Stay up to date with what matters.</p>
          </div>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => onOpenChange?.(false)}
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-border/60 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {markAllAsReadLabel}
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {viewAllLabel}
          </button>
        </div>
      </CardHeader>

      <CardContent className="max-h-[70vh] overflow-y-auto p-0">
        {loading ? (
          loadingState ?? (
            <div className="p-4 text-sm text-muted-foreground">Loading notifications…</div>
          )
        ) : error ? (
          errorState ?? (
            <div className="p-4 text-sm text-muted-foreground">We couldn’t load notifications right now.</div>
          )
        ) : groups.length === 0 ? (
          emptyState ?? (
            <div className="p-4 text-sm text-muted-foreground">You’re all caught up for now.</div>
          )
        ) : (
          <div className="divide-y divide-border/60">
            {groups.map((group) => (
              <section key={group.title} className="px-4 py-3 sm:px-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                  <Badge variant="outline">{group.items.length}</Badge>
                </div>

                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/70">
                        <Avatar className="mt-0.5 size-8">
                          <AvatarFallback>{item.avatarFallback ?? "•"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            {!item.read ? (
                              <span className="size-2 rounded-full bg-primary" aria-label="Unread" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationPanel;
