import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

/**
 * Create a new attendee (for migration script)
 *
 * This mutation is used by the migration script to bulk insert attendees.
 * Regular app usage should use the standard `register` mutation instead.
 */
export const createFromMigration = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    eventId: v.id("events"),
    qrCode: v.string(),
    checkedIn: v.boolean(),
    checkedInAt: v.optional(v.number()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const attendeeId = await ctx.db.insert("attendees", {
      name: args.name,
      email: args.email,
      eventId: args.eventId,
      qrCode: args.qrCode,
      checkedIn: args.checkedIn,
      checkedInAt: args.checkedInAt,
      createdAt: args.createdAt,
    });

    return attendeeId;
  },
});

/**
 * Get all attendees (for migration validation)
 *
 * This query is used by the migration script to validate data integrity.
 * Regular app usage should use more specific queries instead.
 */
export const getAllForMigration = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendees").collect();
  },
});

/**
 * Get a single attendee by ID
 *
 * This is the equivalent of the tRPC `attendees.getById` query.
 */
export const getById = query({
  args: { attendeeId: v.id("attendees") },
  handler: async (ctx, args) => {
    const attendee = await ctx.db.get(args.attendeeId);

    if (!attendee) {
      return null;
    }

    return {
      _id: attendee._id,
      name: attendee.name,
      email: attendee.email,
      eventId: attendee.eventId,
      qrCode: attendee.qrCode,
      checkedIn: attendee.checkedIn,
      checkedInAt: attendee.checkedInAt,
    };
  },
});

/**
 * Get attendee by QR code
 *
 * Used for check-in scanning.
 */
export const getByQrCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const attendee = await ctx.db
      .query("attendees")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .first();

    return attendee;
  },
});

/**
 * Register a new attendee for an event
 *
 * This is the equivalent of the tRPC `attendees.register` mutation.
 */
export const register = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if event exists
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new ConvexError("Event not found");
    }

    // Check capacity
    const attendees = await ctx.db
      .query("attendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (attendees.length >= event.capacity) {
      throw new ConvexError("Event is at full capacity");
    }

    // Create attendee
    const attendeeId = await ctx.db.insert("attendees", {
      name: args.name,
      email: args.email,
      eventId: args.eventId,
      qrCode: crypto.randomUUID(), // Generate unique QR code
      checkedIn: false,
      createdAt: Date.now(),
    });

    return attendeeId;
  },
});
