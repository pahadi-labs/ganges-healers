import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SearchPaletteSection {
  /** Section heading. */
  title: string;
  /** Content rendered inside the section. */
  items: Array<{ label: string; description?: string; href?: string }>;
}

export interface SearchPaletteProps {
  /** Whether the dialog is open. */
  open?: boolean;
  /** Callback for open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** The current search string. */
  query?: string;
  /** Optional placeholder content for the input. */
  placeholder?: string;
  /** Optional title for the dialog. */
  title?: string;
  /** Optional description for the dialog. */
  description?: string;
  /** Optional recent searches section. */
  recentSearches?: SearchPaletteSection;
  /** Optional quick links section. */
  quickLinks?: SearchPaletteSection;
  /** Optional popular searches section. */
  popularSearches?: SearchPaletteSection;
  /** Optional empty state content. */
  emptyState?: ReactNode;
  /** Optional loading state content. */
  loadingState?: ReactNode;
  /** Whether to show the loading state. */
  loading?: boolean;
  /** Whether to show the empty state. */
  empty?: boolean;
  /** Optional keyboard shortcut hint. */
  shortcutLabel?: string;
  /** Additional classes for the dialog content. */
  className?: string;
}

/**
 * Reusable search palette shell for Navigation V2.
 *
 * This component is intentionally UI-only and does not perform routing, API
 * calls, or business logic. It provides the structure for future search
 * experiences with placeholder sections and state handling.
 */
export function SearchPalette({
  open = false,
  onOpenChange,
  query = "",
  placeholder = "Search programs, services, and more",
  title = "Search",
  description = "Find what you need quickly",
  recentSearches,
  quickLinks,
  popularSearches,
  emptyState,
  loadingState,
  loading = false,
  empty = false,
  shortcutLabel = "⌘K / Ctrl+K",
  className,
}: SearchPaletteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl gap-0 overflow-hidden border-border/60 p-0 sm:max-w-2xl",
          className,
        )}
        aria-label={title}
      >
        <div className="border-b border-border/60 p-4 sm:p-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-base font-semibold text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 shadow-sm">
            <span className="text-sm text-muted-foreground" aria-hidden="true">
              ⌕
            </span>
            <input
              value={query}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search input"
            />
            <span className="rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground">
              {shortcutLabel}
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          {loading ? (
            loadingState ?? (
              <div className="rounded-md border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Loading suggestions...
              </div>
            )
          ) : empty ? (
            emptyState ?? (
              <div className="rounded-md border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                No results yet. Try another search term.
              </div>
            )
          ) : (
            <div className="space-y-6">
              {recentSearches ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{recentSearches.title}</h3>
                  <ul className="space-y-2">
                    {recentSearches.items.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          className="flex w-full items-start justify-between rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <span>{item.label}</span>
                          {item.description ? (
                            <span className="text-muted-foreground">{item.description}</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {quickLinks ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{quickLinks.title}</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {quickLinks.items.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          className="flex w-full flex-col rounded-md border border-border/60 px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <span className="font-medium">{item.label}</span>
                          {item.description ? (
                            <span className="mt-1 text-muted-foreground">{item.description}</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {popularSearches ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{popularSearches.title}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {popularSearches.items.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SearchPalette;
