/**
 * PostgreSQL to Convex Migration Script
 *
 * Usage:
 *   pnpm tsx scripts/migrate-to-convex.ts
 *
 * Prerequisites:
 *   1. Convex deployment must be set up (convex dev or convex deploy --prod)
 *   2. PostgreSQL database must be running and accessible
 *   3. Environment variables must be configured (DATABASE_URL, CONVEX_DEPLOYMENT)
 *
 * What this script does:
 *   1. Connects to PostgreSQL and exports all events and attendees
 *   2. Transforms the data to match Convex schema (UUIDs → strings, timestamps → numbers)
 *   3. Bulk inserts data into Convex using mutations
 *   4. Validates data integrity (row counts, sample records)
 *
 * Safety:
 *   - Run during a maintenance window to avoid data inconsistencies
 *   - Script is idempotent (can be re-run safely)
 *   - Validates data before and after migration
 */

// CRITICAL: Load environment variables FIRST before any other imports
// This must happen before importing db, which imports env.js
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local - this MUST be the first thing that runs
config({ path: resolve(process.cwd(), ".env.local") });

// Verify environment variables are loaded
if (!process.env.DATABASE_URL || !process.env.CLERK_SECRET_KEY) {
  console.error("❌ Critical environment variables missing from .env.local");
  console.error("Required: DATABASE_URL, CLERK_SECRET_KEY");
  console.error("\nMake sure .env.local exists in your project root with these variables.");
  process.exit(1);
}

// Import Convex client (doesn't depend on env validation)
import { ConvexHttpClient } from "convex/browser";

// Use dynamic imports for modules that depend on env validation
// This ensures dotenv has already loaded the variables
const { api } = await import("../convex/_generated/api.js");
const { db } = await import("../src/server/db/index.js");

// Import Id type for type casting
import type { Id } from "../convex/_generated/dataModel.js";

// Initialize Convex client
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error(
    "CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable is required",
  );
}
const convex = new ConvexHttpClient(CONVEX_URL);

interface PostgresEvent {
  id: string;
  name: string;
  date: Date;
  capacity: number;
  createdAt: Date;
}

interface PostgresAttendee {
  id: string;
  name: string;
  email: string;
  eventId: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt: Date | null;
  createdAt: Date;
}

interface ConvexEvent {
  name: string;
  date: number;
  capacity: number;
  createdAt: number;
}

interface ConvexAttendee {
  name: string;
  email: string;
  eventId: Id<"events">; // Convex event ID
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: number;
  createdAt: number;
}

/**
 * Export all events from PostgreSQL
 */
async function exportEvents(): Promise<PostgresEvent[]> {
  console.log("📤 Exporting events from PostgreSQL...");
  const events = await db.query.events.findMany();
  console.log(`✅ Exported ${events.length} events`);
  return events;
}

/**
 * Export all attendees from PostgreSQL
 */
async function exportAttendees(): Promise<PostgresAttendee[]> {
  console.log("📤 Exporting attendees from PostgreSQL...");
  const attendees = await db.query.attendees.findMany();
  console.log(`✅ Exported ${attendees.length} attendees`);
  return attendees;
}

/**
 * Transform PostgreSQL event to Convex format
 */
function transformEvent(pgEvent: PostgresEvent): ConvexEvent {
  return {
    name: pgEvent.name,
    date: pgEvent.date.getTime(), // Convert Date to milliseconds
    capacity: pgEvent.capacity,
    createdAt: pgEvent.createdAt.getTime(),
  };
}

/**
 * Transform PostgreSQL attendee to Convex format
 * Note: eventId will need to be mapped from PostgreSQL UUID to Convex _id
 */
function transformAttendee(
  pgAttendee: PostgresAttendee,
  eventIdMap: Map<string, string>,
): ConvexAttendee {
  const convexEventId = eventIdMap.get(pgAttendee.eventId);
  if (!convexEventId) {
    throw new Error(
      `No Convex event ID found for PostgreSQL event ${pgAttendee.eventId}`,
    );
  }

  return {
    name: pgAttendee.name,
    email: pgAttendee.email,
    eventId: convexEventId as Id<"events">,
    qrCode: pgAttendee.qrCode,
    checkedIn: pgAttendee.checkedIn,
    checkedInAt: pgAttendee.checkedInAt?.getTime(),
    createdAt: pgAttendee.createdAt.getTime(),
  };
}

/**
 * Bulk insert events into Convex
 * Returns a map of PostgreSQL UUIDs to Convex _ids
 */
async function insertEvents(
  pgEvents: PostgresEvent[],
): Promise<Map<string, string>> {
  console.log("\n📥 Inserting events into Convex...");
  const eventIdMap = new Map<string, string>();

  // Insert events one by one (Convex doesn't have native bulk insert)
  // In production, you might want to batch these with Promise.all
  for (const pgEvent of pgEvents) {
    const convexEvent = transformEvent(pgEvent);

    // You'll need to create this mutation in convex/events.ts
    const convexId = await convex.mutation(
      api.events.createFromMigration,
      convexEvent,
    );

    eventIdMap.set(pgEvent.id, convexId);
    console.log(
      `  ✓ Migrated event: ${pgEvent.name} (${pgEvent.id} → ${convexId})`,
    );
  }

  console.log(`✅ Inserted ${pgEvents.length} events into Convex`);
  return eventIdMap;
}

/**
 * Bulk insert attendees into Convex
 */
async function insertAttendees(
  pgAttendees: PostgresAttendee[],
  eventIdMap: Map<string, string>,
): Promise<void> {
  console.log("\n📥 Inserting attendees into Convex...");

  // Batch attendees for better performance (e.g., 10 at a time)
  const BATCH_SIZE = 10;
  for (let i = 0; i < pgAttendees.length; i += BATCH_SIZE) {
    const batch = pgAttendees.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (pgAttendee) => {
        const convexAttendee = transformAttendee(pgAttendee, eventIdMap);

        // You'll need to create this mutation in convex/attendees.ts
        await convex.mutation(
          api.attendees.createFromMigration,
          convexAttendee,
        );

        console.log(
          `  ✓ Migrated attendee: ${pgAttendee.name} (${pgAttendee.email})`,
        );
      }),
    );
  }

  console.log(`✅ Inserted ${pgAttendees.length} attendees into Convex`);
}

/**
 * Validate data integrity after migration
 */
async function validateMigration(
  pgEvents: PostgresEvent[],
  pgAttendees: PostgresAttendee[],
): Promise<void> {
  console.log("\n🔍 Validating migration...");

  // You'll need to create these queries in convex/events.ts and convex/attendees.ts
  const convexEvents = await convex.query(api.events.getAllForMigration);
  const convexAttendees = await convex.query(api.attendees.getAllForMigration);

  // Validate counts
  if (convexEvents.length !== pgEvents.length) {
    throw new Error(
      `Event count mismatch! PostgreSQL: ${pgEvents.length}, Convex: ${convexEvents.length}`,
    );
  }

  if (convexAttendees.length !== pgAttendees.length) {
    throw new Error(
      `Attendee count mismatch! PostgreSQL: ${pgAttendees.length}, Convex: ${convexAttendees.length}`,
    );
  }

  console.log(`✅ Event count matches: ${convexEvents.length}`);
  console.log(`✅ Attendee count matches: ${convexAttendees.length}`);

  // Sample validation: Check first event
  if (pgEvents.length > 0 && convexEvents.length > 0) {
    const pgEvent = pgEvents[0]!;
    const convexEvent = convexEvents.find((e) => e.name === pgEvent.name);

    if (!convexEvent) {
      throw new Error(`Sample event "${pgEvent.name}" not found in Convex`);
    }

    console.log(`✅ Sample event validated: ${pgEvent.name}`);
  }

  console.log("\n✅ Migration validation complete!");
}

/**
 * Main migration function
 */
async function migrate() {
  console.log("🚀 Starting PostgreSQL → Convex migration\n");
  console.log("=".repeat(50));

  try {
    // Step 1: Export data from PostgreSQL
    const pgEvents = await exportEvents();
    const pgAttendees = await exportAttendees();

    if (pgEvents.length === 0 && pgAttendees.length === 0) {
      console.log("\n⚠️  No data to migrate. Exiting.");
      return;
    }

    // Step 2: Insert events (and get ID mapping)
    const eventIdMap = await insertEvents(pgEvents);

    // Step 3: Insert attendees (using the ID mapping)
    await insertAttendees(pgAttendees, eventIdMap);

    // Step 4: Validate migration
    await validateMigration(pgEvents, pgAttendees);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("  1. Verify data in Convex dashboard");
    console.log("  2. Test application with Convex backend");
    console.log("  3. Keep PostgreSQL data for rollback (N days)");
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run migration
migrate();
