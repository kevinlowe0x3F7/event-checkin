# Event check in

## V1: Server actions + server components
### Pre feature implementation tasks
- [x] Install spec MCP workflow
- [x] Setup Clerk
- [x] Create database schema
- [x] Setup drizzle
- [x] Push schema to database
- [x] Update root layout
- [x] Create simple homepage

### Events CRUD
- [x] app/events/page.tsx (list - Server Component)
- [x] app/events/new/page.tsx (create - Server Action)
- [x] Test: Create and view events

### Event Details & Registration  
- [x] app/events/[id]/page.tsx (details)
- [x] app/events/[id]/register/page.tsx (registration)
- [x] Test: Register for event

### QR Ticket
- [x] app/events/[eventId]/ticket/[attendeeId]/page.tsx
- [x] Test: See QR after registering

### Check-in Dashboard
- [x] app/events/[id]/checkin/page.tsx (Client Component with scanner)
- [x] app/api/checkin/route.ts (POST endpoint)
- [x] app/api/events/[id]/attendees/route.ts (GET endpoint)
- [x] Test: Scan QR, see manual refresh needed

Commit hash of finished V1: a2b1cbb7f02a176fef2a5008a954e57c55381547
State of code at finished V1: https://github.com/kevinlowe0x3F7/event-checkin/tree/a2b1cbb7f02a176fef2a5008a954e57c55381547

## V2: tRPC
- [x] Setup root router and infra (e.g. adding db to the tRPC context)
- [x] Setup the three necessary routers (attendeesRouter, eventRouter, checkInRouter)
- [x] Add the query and mutation procedures for each of them (effectively adding a bunch of endpoints)
- [x] Replace the db inserts in the server action calls with the tRPC mutation instead
- [x] Replace all the server component db loads with the tRPC calls (note that this will still be server components)

Commit hash of finished V2: 23b17b17bf37dbf502170bc12293cdb16ee1acf6
Diff: https://github.com/kevinlowe0x3F7/event-checkin/pull/1

## V3: Convex

### Setup & Migration
- [x] Install Convex npm packages
- [x] Setup Convex deployment (convex dev / convex deploy)
- [x] Define Convex schema in `convex/schema.ts` (equivalent to Drizzle schema)
  - events table
  - attendees table
- [x] Migrate existing PostgreSQL data to Convex
  - **Option 1: Fresh start (development/staging)**
    - Drop existing Convex tables
    - Recreate test data using Convex mutations
  - **Option 2: One-time migration (production)**
    - Export data from PostgreSQL using Drizzle queries
    - Transform data to match Convex schema (UUIDs, timestamps, etc.)
    - Write migration script (`scripts/migrate-to-convex.ts`) to bulk insert via Convex mutations
    - Run migration during maintenance window
    - Validate data integrity (row counts, sample records)
  - **Option 3: Zero-downtime migration (production)**
    - Phase 1: Dual-write - Write to both PostgreSQL and Convex simultaneously
    - Phase 2: Backfill - Copy existing PostgreSQL data to Convex in batches
    - Phase 3: Validation - Verify data consistency between both databases
    - Phase 4: Switch reads - Update queries to read from Convex instead of PostgreSQL
    - Phase 5: Monitor - Run both databases in parallel, monitor for issues
    - Phase 6: Cleanup - Remove PostgreSQL writes after confidence period
  - **Rollback plan**: Keep PostgreSQL schema and data for N days after cutover

### Replace Database Layer
- [x] Create Convex query functions in `convex/` directory
  - `convex/events.ts`: allEvents, getEventWithAttendees
  - `convex/attendees.ts`: getById, register
  - `convex/checkin.ts`: checkIn
- [x] Remove tRPC routers (no longer needed - Convex replaces tRPC)
- [x] Remove Drizzle ORM and PostgreSQL setup

### Convert to Client Components with Real-Time Updates
- [x] Setup ConvexClientProvider in root layout
- [x] Convert all pages to client components using Convex hooks:
  - `/events/page.tsx` - Use `useQuery(api.events.allEvents)` for real-time event list
  - `/events/[id]/page.tsx` - Use `useQuery(api.events.getEventWithAttendees)` for real-time attendee list
  - `/events/[id]/register/page.tsx` - Use `useMutation(api.attendees.register)` for registration
  - `/events/[id]/checkin/page.tsx` - Convert CheckInScanner to use `useQuery()` and `useMutation(api.checkin.checkIn)`
  - `/events/[id]/attendee/[attendeeId]/page.tsx` - Use `useQuery()` for real-time check-in status updates
- [x] Replace all server actions with Convex mutations
- [x] Remove all `revalidatePath()` calls (no longer needed with real-time subscriptions!)

### Remove Old Infrastructure
- [x] Remove tRPC setup (`src/server/api/`, `src/trpc/`)
- [x] Remove Drizzle schema and migrations
- [x] Remove PostgreSQL connection
- [x] Update environment variables (remove DATABASE_URL, add CONVEX_DEPLOYMENT)

### Testing & Demo
- [x] Test: Create event, register attendees
- [x] Test: Check-in flow works
- [x] Magic demo: Scan QR from attendee's device, see that attendee's device, event details table, and scanner all update automatically in real-time across all devices

# Learnings

## V1: Server actions + server components (what can be improved)
1. After I scan the QR code on my phone, I have to manually refresh the page to see that this person has checked in.
2. Have to make a bunch of type assertions on the form data
3. There are type safety gaps between server actions and the client. Server action signatures aren't enforced at compile time, so if I change the return type on the server, the client won't know until runtime.
4. Race conditions if two staff members check people in at the same time. Could be a problem in the future (e.g. we track which staff member checked someone in. It'd be last write wins.)
5. RevalidatePath called in various spots. Not clear where exactly it needs to happen
6. No optimistic updates on the check in scanner. It'd be nice that when staff member scans, it first shows the success, and then the database gets updated behind the scenes.
7. Type safety gaps between the DB schema and actions

Clearly a lot of potential problems in the future. The next step will be to use tRPC to address some of these.

## V2: tRPC (what can be improved still)

One thing we have made much better is the type safety across the entire app. For example, if I were to go ahead and add an extra field to the Events schema that I return in all my APIs, the frontend automatically gets those updated.

Note that this was not a large change, because this is a net improvement on what was existing by adding type safety. A Convex migration, however, would be an entirely different paradigm shift.

1. Still need to manually refresh pages whenever the server gets updated
2. Still race conditions when two staff members check in at the same time

## V3: Convex

Convex is so cool. I also now understand that server components may not be all that great, especially if we have to wrap them in so much complexity where they differ. Especially for an application that requires a lot of user interactions, it's not super feasible to have a lot of server components. The interactivity necessitates client components, which do just fine in terms of performance. Server components are better suited for more static pages.

But Convex as an application database is so sweet because it acts as the single source of truth for the data everywhere. The DevX has also been great, in having dev deployments, production deployments. I didn't use preview deployments, but it would be something we would 100% have in the future.

The migration from Postgres to Convex also isn't too bad. At least for the copy the data over version where there is downtime.

# Convex Demo

https://github.com/user-attachments/assets/8f00fbb5-a1cf-493a-a548-82c4b3ea90ad

