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
- [ ] Test: Register for event

### QR Ticket
- [x] app/events/[eventId]/ticket/[attendeeId]/page.tsx
- [x] Test: See QR after registering

### Check-in Dashboard
- [x] app/events/[id]/checkin/page.tsx (Client Component with scanner)
- [x] app/api/checkin/route.ts (POST endpoint)
- [x] app/api/events/[id]/attendees/route.ts (GET endpoint)
- [x] Test: Scan QR, see manual refresh needed

# Learnings

## Server actions + server components
