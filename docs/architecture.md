# System Architecture

Technical architecture overview of the Ganges Healers wellness marketplace.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.5 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Database** | PostgreSQL (Neon) via Prisma 6.16 |
| **Authentication** | NextAuth v5 (beta 29) — JWT strategy |
| **Payments** | Razorpay (orders, subscriptions, webhooks) |
| **Email** | Resend + React Email |
| **File Storage** | Vercel Blob |
| **Background Jobs** | BullMQ + Redis (optional) |
| **Real-time** | Socket.IO (polling fallback) |
| **Monitoring** | Sentry |
| **Deployment** | Vercel |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── admin/              # Admin dashboard (RBAC-protected)
│   ├── api/                # REST API endpoints
│   │   ├── auth/           # Registration, test login
│   │   ├── availability/   # Healer slot availability
│   │   ├── bookings/       # CRUD + reschedule/cancel
│   │   ├── blog/           # Blog listing & detail
│   │   ├── audio/          # Audio library
│   │   ├── community/      # Posts, comments, likes (VIP-gated)
│   │   ├── courses/        # Enrollment, progress tracking
│   │   ├── cron/           # Scheduled jobs (booking reminders)
│   │   ├── health/         # Health check endpoint
│   │   ├── healers/        # Healer profiles & search
│   │   ├── invoices/       # Invoice generation & download
│   │   ├── memberships/    # VIP subscription management
│   │   ├── notifications/  # User notifications
│   │   ├── payments/       # Razorpay orders, verification, webhooks
│   │   ├── programs/       # Program enrollment
│   │   ├── search/         # Full-text search (PostgreSQL tsvector)
│   │   ├── services/       # Service listing & admin CRUD
│   │   ├── store/          # Product catalog, checkout, orders
│   │   └── users/          # Profile, avatar, settings
│   ├── auth/               # Sign-in & sign-up pages
│   ├── dashboard/          # User dashboard
│   ├── healers/            # Healer directory & profiles
│   ├── programs/           # Program catalog
│   ├── services/           # Service catalog
│   └── store/              # E-commerce storefront
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── booking/            # Booking modal, calendar
│   ├── dashboard/          # Dashboard widgets
│   ├── invoices/           # Invoice display
│   └── seo/                # SEO components
├── lib/                    # Shared business logic
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   ├── razorpay.ts         # Razorpay client
│   ├── rbac.ts             # Role-based access control
│   ├── cache.ts            # In-memory TTL cache
│   ├── rate-limit.ts       # Sliding window rate limiter
│   ├── socket.ts           # Socket.IO server
│   ├── socket-client.ts    # Socket.IO client
│   ├── validate-env.ts     # Startup env validation
│   ├── queues/             # BullMQ job queues & workers
│   ├── email/              # Email service & templates
│   ├── payments/           # Payment utilities & refunds
│   ├── bookings/           # Booking business logic
│   ├── analytics/          # Revenue & usage analytics
│   └── seo/                # SEO utilities
├── config/                 # App configuration
└── types/                  # TypeScript type definitions
prisma/
├── schema.prisma           # Database schema (25+ models)
├── seed.ts                 # Demo data seeding
└── migrations/             # SQL migrations
```

---

## Database Schema

### Core Models

```
User ─── Healer (1:1)
  │  ├── Booking ──── Payment ──── Refund
  │  ├── ProgramEnrollment ──── Program
  │  ├── CourseEnrollment ──── Course ──── CourseLesson
  │  ├── VIPMembership ──── MembershipPlan
  │  ├── Order ──── OrderItem ──── Product ──── ProductCategory
  │  ├── CommunityPost ──── CommunityComment
  │  │                  └── CommunityLike
  │  ├── Notification
  │  ├── ActivityLog
  │  └── SessionCredit
  │
Service ──── Booking
         └── Product (optional link)

BlogPost (standalone)
AudioTrack (standalone)
Invoice ──── Payment
```

### Key Design Decisions

- **JSON fields** for flexible data: healer availability, certifications, billing addresses, order metadata
- **Slug-based routing** for SEO-friendly URLs on all public entities
- **tsvector + GIN indexes** for PostgreSQL full-text search across 7 models
- **Composite indexes** for common query patterns (user bookings by date, healer schedule lookups)
- **Soft references** via `PaymentType` enum for generic payment tracking across booking/program/membership/store/course

---

## Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Sign-in UI │────▶│ NextAuth v5  │────▶│   JWT    │
│  (Credentials│     │ Credentials  │     │ Session  │
│   or Google) │     │  + Google    │     │ (Cookie) │
└─────────────┘     └──────────────┘     └──────────┘
                           │
                    ┌──────┴──────┐
                    │  Callbacks  │
                    │ (jwt + session)
                    │ Adds: id, role,│
                    │ vip, credits  │
                    └─────────────┘
```

- **JWT strategy** — no database sessions, stateless
- **Credentials provider** with bcrypt password hashing
- **Google OAuth** (optional, fallback to credentials-only if not configured)
- **RBAC** via `role` field: USER, HEALER, ADMIN
- **VIP gating** via `vip` boolean for premium features (community, premium audio)
- **Free session credits** tracked per user for booking without payment

---

## Payment Architecture

```
┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌──────────┐
│  Client  │───▶│ POST /api/   │───▶│ Razorpay  │───▶│ Webhook  │
│  (React) │    │ payments/    │    │   API     │    │ Callback │
│          │    │ create-order │    │           │    │          │
└──────────┘    └──────────────┘    └───────────┘    └──────────┘
     │                                                     │
     │          ┌──────────────┐                          │
     └─────────▶│ POST /api/   │◀─────────────────────────┘
                │ payments/    │
                │ verify       │──▶ Update booking/enrollment
                └──────────────┘    Create invoice
                                    Send confirmation email
```

### Payment Types
- **SESSION** — Booking a healer session
- **PROGRAM** — Enrolling in a multi-session program
- **MEMBERSHIP** — VIP subscription (Razorpay recurring)
- **STORE** — Product purchase
- **COURSE** — Course enrollment

### Webhook Processing
Razorpay sends webhook events to `/api/payments/webhook`. Events are verified via HMAC signature, then processed:
- `payment.captured` → Mark payment SUCCESS, trigger side-effects
- `subscription.activated` → Activate VIP membership, grant credits
- `refund.processed` → Record refund, update payment status

---

## Booking Lifecycle

```
PENDING ──▶ SCHEDULED ──▶ CONFIRMED ──▶ COMPLETED
   │            │              │
   │            ▼              ▼
   │       RESCHEDULED    CANCELLED
   │            │
   ▼            ▼
CANCELLED   SCHEDULED
```

1. User selects service + healer + available time slot
2. Booking created as PENDING with price snapshot
3. Payment collected (or free session credit deducted)
4. Status moves to SCHEDULED → CONFIRMED
5. Meeting link generated for online sessions
6. 24h reminder email via cron job
7. Healer marks COMPLETED or user cancels (with optional refund)

---

## Background Jobs (BullMQ)

Three queues handle async work:

| Queue | Purpose | Workers |
|---|---|---|
| `email` | Transactional email delivery via Resend | 1 |
| `notification` | In-app notification creation | 1 |
| `activity` | Activity log recording | 1 |

- **Graceful degradation:** If Redis is unavailable, operations execute synchronously inline
- **Worker process:** Run separately via `pnpm worker` or in-process on Vercel

---

## Course Delivery System

```
┌──────────────┐    Enroll     ┌──────────────────┐
│    Course    │◀──────────────│  CourseEnrollment │
│  (lessons)   │               │  (userId, status) │
└──────┬───────┘               └────────┬──────────┘
       │                                │
       │ hasMany                        │ tracks progress
       ▼                                ▼
┌──────────────┐               ┌──────────────────┐
│ CourseLesson │               │  lessonProgress  │
│ (order, content)             │  (lessonOrder,   │
│              │               │   completedAt)   │
└──────────────┘               └──────────────────┘
```

### Enrollment Flow
1. User browses `/courses` catalog (Server Component, cached)
2. User views course detail at `/courses/[slug]` with lesson list
3. Enrollment via `POST /api/courses/[slug]/enroll` — creates `CourseEnrollment` record
4. Payment collected via Razorpay (`COURSE` payment type) or free enrollment for VIP users
5. Enrollment status set to `ACTIVE`

### Progress Tracking
- Lesson completion via `POST /api/courses/[slug]/progress` with `{ lessonOrder }` 
- Progress stored per-enrollment — tracks which lessons are completed and when
- Progress percentage calculated as `completedLessons / totalLessons`
- Enrolled courses viewable at `/courses/enrolled` dashboard

### Access Control
- Course listing is public; lesson content requires active enrollment
- VIP members may access premium courses without payment
- Progress API validates enrollment ownership (user can only update their own)

---

## Real-time Notifications (Socket.IO)

```
┌──────────┐    WebSocket     ┌──────────────┐
│  Client  │◀────────────────▶│  Socket.IO   │
│ (Browser)│    (or polling)  │   Server     │
└──────────┘                  └──────┬───────┘
                                     │
                              ┌──────┴───────┐
                              │   Next.js    │
                              │ HTTP Server  │
                              └──────────────┘
```

- Users join a room based on their `userId`
- Server emits `notification` events when new notifications are created
- Client uses `socket-client.ts` hook for connection management
- Falls back to HTTP polling on platforms without WebSocket support (Vercel)

---

## Search Architecture

### PostgreSQL Full-Text Search

```sql
-- tsvector columns on 7 models (Service, Healer, Program, Course, Product, AudioTrack, BlogPost)
-- Auto-populated via trigger on INSERT/UPDATE
-- GIN indexes for fast lookup
-- ts_rank for relevance ordering
```

The `/api/search?q=...` endpoint queries all models in parallel, ranks results, and returns categorized results with caching (60s TTL).

---

## Caching Strategy

- **In-memory TTL cache** (`src/lib/cache.ts`) with configurable TTL (default 60s)
- Applied to read-heavy API routes: services listing, healer profiles, search results, blog posts
- Cache is per-instance (not shared across Vercel functions), sized for single-server or few-instance deployments
- No external cache dependency — works without Redis

---

## Rate Limiting

- **Sliding window** algorithm implemented in `src/lib/rate-limit.ts`
- Applied via Next.js middleware to sensitive endpoints:
  - `/api/auth/*` — Authentication attempts
  - `/api/bookings` — Booking creation
  - `/api/community/*` — Community interactions
  - `/api/search` — Search queries
- **Default:** 100 requests per minute per IP
- Returns `429 Too Many Requests` when exceeded

---

## Security

- **Security headers** via `vercel.json`: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy
- **CSRF protection** via NextAuth CSRF token
- **Webhook HMAC verification** for Razorpay events
- **Input validation** with Zod schemas on all API routes
- **Role-based access control** on admin and healer endpoints
- **Rate limiting** on authentication and sensitive endpoints
- **Environment validation** on startup (fail-fast for missing required vars)

---

## Monitoring & Observability

| Tool | Purpose |
|---|---|
| **Sentry** | Error tracking, performance monitoring |
| **Health endpoint** | `/api/health` — DB, Redis, queue status, uptime |
| **Activity logs** | User action audit trail (stored in DB) |
| **Vercel Analytics** | Page views, web vitals (if enabled) |
