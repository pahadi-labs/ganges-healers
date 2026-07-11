"use client";

import { useState } from "react";
import { BookSessionButton } from "./BookSessionButton";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { NotificationPanel } from "./NotificationPanel";
import { SearchPalette } from "./SearchPalette";
import { UserMenu } from "./UserMenu";

export interface NavigationV2NavbarProps {
  /** Optional className for the outer wrapper. */
  className?: string;
}

/**
 * Composition shell for Navigation V2.
 *
 * This component assembles the new desktop and mobile navigation surfaces with
 * placeholder state only. It is intentionally isolated from the existing app
 * wiring and does not replace the current navbar yet.
 */
export function Navbar({ className }: NavigationV2NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const desktopItems = [
    { label: "Programs", href: "/programs" },
    { label: "Services", href: "/services" },
    { label: "Audio", href: "/audio" },
    { label: "Community", href: "/community" },
    { label: "Courses", href: "/courses" },
  ];

  const mobilePrimaryItems = [
    { label: "Programs", href: "/programs" },
    { label: "Services", href: "/services" },
    { label: "Audio", href: "/audio" },
    { label: "Community", href: "/community" },
  ];

  const mobileSecondaryItems = [
    { label: "Courses", href: "/courses" },
    { label: "Blog", href: "/blog" },
    { label: "Store", href: "/store" },
  ];

  return (
    <div className={className}>
      <DesktopNav
        items={desktopItems}
        searchLabel="Search"
        notificationLabel="Alerts"
        userMenuLabel="Account"
        ctaLabel="Book a Session"
        ctaHref="/"
        className="w-full"
      />

      <div className="flex items-center justify-between border-b border-border/60 bg-background px-4 py-3 md:hidden">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          Menu
        </button>

        <BookSessionButton size="sm" href="/">
          Book a Session
        </BookSessionButton>
      </div>

      <MobileNav
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        primaryItems={mobilePrimaryItems}
        secondaryItems={mobileSecondaryItems}
        ctaLabel="Book a Session"
        ctaHref="/"
        className="w-full"
      />

      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        recentSearches={{
          title: "Recent searches",
          items: [
            { label: "Chakra healing", description: "Programs" },
            { label: "Sound therapy", description: "Services" },
          ],
        }}
        quickLinks={{
          title: "Quick links",
          items: [
            { label: "Programs", description: "Explore offerings" },
            { label: "Book a session", description: "Start your journey" },
          ],
        }}
        popularSearches={{
          title: "Popular searches",
          items: [{ label: "Meditation" }, { label: "Ayurveda" }, { label: "Healing" }],
        }}
      />

      <NotificationPanel
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        groups={[
          {
            title: "Today",
            items: [
              {
                id: "n1",
                title: "New session available",
                message: "A new healing session is ready to book.",
                time: "Just now",
              },
            ],
          },
          {
            title: "Yesterday",
            items: [
              {
                id: "n2",
                title: "Program update",
                message: "A new guided program was added.",
                time: "Yesterday",
              },
            ],
          },
        ]}
      />

      <UserMenu
        open={userMenuOpen}
        onOpenChange={setUserMenuOpen}
        mode="logged-in"
        name="Asha"
        email="asha@example.com"
        membershipBadge="Member"
      />
    </div>
  );
}

export default Navbar;
