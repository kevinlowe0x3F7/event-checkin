import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema for event check-in system
 *
 * Migrated from Drizzle PostgreSQL schema
 *
 * Key differences from PostgreSQL:
 * - Convex uses _id (string) instead of UUID for primary keys
 * - Timestamps are stored as numbers (milliseconds since epoch)
 * - Foreign keys are enforced by application logic, not database constraints
 * - Snake_case fields converted to camelCase (Convex convention)
 */
export default defineSchema({
  events: defineTable({
    name: v.string(),
    date: v.number(), // Timestamp in milliseconds
    capacity: v.number(),
    createdAt: v.number(), // Timestamp in milliseconds
  }),

  attendees: defineTable({
    name: v.string(),
    email: v.string(),
    eventId: v.id("events"), // Foreign key reference to events table
    qrCode: v.string(), // Unique QR code identifier
    checkedIn: v.boolean(),
    checkedInAt: v.optional(v.number()), // Timestamp in milliseconds, nullable
    createdAt: v.number(), // Timestamp in milliseconds
  })
    .index("by_event", ["eventId"]) // Index for fast lookups by event
    .index("by_qr_code", ["qrCode"]), // Index for QR code scanning
});
