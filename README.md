# Event check in

## Day 1
### Pre feature implementation tasks
- [x] Install spec MCP workflow
- [x] Setup Clerk
- [x] Create database schema
- [x] Setup drizzle
- [x] Push schema to database
- [x] Update root layout
- [x] Create simple homepage

### Events CRUD
- [ ] app/events/page.tsx (list - Server Component)
- [ ] app/events/new/page.tsx (create - Server Action)
- [ ] Test: Create and view events

### Event Details & Registration  
- [ ] app/events/[id]/page.tsx (details)
- [ ] app/events/[id]/register/page.tsx (registration)
- [ ] Test: Register for event

### QR Ticket
- [ ] app/events/[eventId]/ticket/[attendeeId]/page.tsx
- [ ] Test: See QR after registering

### Check-in Dashboard
- [ ] app/events/[id]/checkin/page.tsx (Client Component with scanner)
- [ ] app/api/checkin/route.ts (POST endpoint)
- [ ] app/api/events/[id]/attendees/route.ts (GET endpoint)
- [ ] Test: Scan QR, see manual refresh needed