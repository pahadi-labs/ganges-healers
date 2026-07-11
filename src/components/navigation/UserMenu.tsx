import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NavItem, type NavItemProps } from "./NavItem";
import { NavSection } from "./NavSection";

export type UserMenuMode = "guest" | "logged-in" | "healer" | "admin";

export interface UserMenuItem
  extends Pick<NavItemProps, "label" | "href" | "active" | "disabled" | "badge" | "external" | "showDropdownIndicator"> {
  /** Optional content override for custom item rendering. */
  children?: ReactNode;
  /** Optional classes applied to the list item. */
  className?: string;
  /** Optional classes applied to the interactive element. */
  linkClassName?: string;
}

export interface UserMenuProps {
  /** Whether the menu is open. */
  open?: boolean;
  /** Callback for opening and closing the menu. */
  onOpenChange?: (open: boolean) => void;
  /** The visual mode that changes the content tone. */
  mode?: UserMenuMode;
  /** Name shown in the profile header. */
  name?: string;
  /** Optional email shown beneath the name. */
  email?: string;
  /** Optional badge shown in the profile header. */
  membershipBadge?: ReactNode;
  /** Optional avatar fallback text. */
  avatarFallback?: string;
  /** Sections rendered inside the menu. */
  sections?: Array<{
    title?: string;
    description?: string;
    items: UserMenuItem[];
  }>;
  /** Optional loading state content. */
  loadingState?: ReactNode;
  /** Optional empty state content. */
  emptyState?: ReactNode;
  /** Whether the menu is in a loading state. */
  loading?: boolean;
  /** Whether the menu has no items. */
  empty?: boolean;
  /** Label for the logout action. */
  logoutLabel?: string;
  /** Additional classes for the card container. */
  className?: string;
}

/**
 * Presentational user menu shell for Navigation V2.
 *
 * This component renders placeholder account navigation content for guest,
 * logged-in, healer, and admin contexts without introducing authentication or
 * routing logic.
 */
export function UserMenu({
  open = false,
  onOpenChange,
  mode = "logged-in",
  name = "Guest",
  email,
  membershipBadge,
  avatarFallback = "U",
  sections = [],
  loadingState,
  emptyState,
  loading = false,
  empty = false,
  logoutLabel = "Log out",
  className,
}: UserMenuProps) {
  if (!open) {
    return null;
  }

  const defaultSections: Array<{
    title?: string;
    description?: string;
    items: UserMenuItem[];
  }> = [
    {
      title: mode === "healer" ? "Workspace" : mode === "admin" ? "Admin" : "My Journey",
      items:
        mode === "healer"
          ? [
              { label: "Dashboard", href: "#" },
              { label: "Bookings", href: "#" },
              { label: "Availability", href: "#" },
            ]
          : mode === "admin"
            ? [
                { label: "Overview", href: "#" },
                { label: "Users", href: "#" },
                { label: "Content", href: "#" },
              ]
            : [
                { label: "My Journey", href: "#" },
                { label: "Bookings", href: "#" },
                { label: "Programs", href: "#" },
                { label: "Courses", href: "#" },
              ],
    },
    {
      title: mode === "guest" ? "Explore" : "Account",
      items:
        mode === "guest"
          ? [
              { label: "Programs", href: "#" },
              { label: "Community", href: "#" },
              { label: "Support", href: "#" },
            ]
          : [
              { label: "Orders", href: "#" },
              { label: "Membership", href: "#" },
              { label: "Community", href: "#" },
            ],
    },
    {
      title: mode === "guest" ? "Help" : "Preferences",
      items:
        mode === "guest"
          ? [
              { label: "Sign In", href: "#" },
              { label: "Create Account", href: "#" },
            ]
          : [
              { label: "Settings", href: "#" },
              { label: "Help", href: "#" },
            ],
    },
  ];

  const resolvedSections: NonNullable<UserMenuProps["sections"]> = sections.length > 0 ? sections : defaultSections;

  return (
    <Card className={cn("w-[min(100vw-2rem,22rem)] border-border/60 bg-card p-0 shadow-lg", className)} role="menu" aria-label="User menu">
      <CardHeader className="border-b border-border/60 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              {membershipBadge ? <Badge variant="outline">{membershipBadge}</Badge> : null}
            </div>
            {email ? <p className="truncate text-sm text-muted-foreground">{email}</p> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-5">
        {loading ? (
          loadingState ?? <div className="text-sm text-muted-foreground">Loading account menu…</div>
        ) : empty ? (
          emptyState ?? <div className="text-sm text-muted-foreground">No account options available.</div>
        ) : (
          <div className="space-y-4">
            {resolvedSections.map((section, index) => (
              <NavSection key={`${section.title ?? index}`} title={section.title} description={section.description} spacing="compact">
                <ul className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <NavItem
                      key={item.href ?? item.label}
                      label={item.label}
                      href={item.href}
                      active={item.active}
                      disabled={item.disabled}
                      badge={item.badge}
                      external={item.external}
                      showDropdownIndicator={item.showDropdownIndicator}
                      className={item.className}
                      linkClassName={item.linkClassName}
                    >
                      {item.children}
                    </NavItem>
                  ))}
                </ul>
              </NavSection>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={() => onOpenChange?.(false)}
        >
          {logoutLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export default UserMenu;
