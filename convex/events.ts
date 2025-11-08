import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new event (for migration script)
 *
 * This mutation is used by the migration script to bulk insert events.
 * Regular app usage should use the standard `create` mutation instead.
 */
export const createFromMigration = mutation({
  args: {
    name: v.string(),
    date: v.number(),
    capacity: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      date: args.date,
      capacity: args.capacity,
      createdAt: args.createdAt,
    });

    return eventId;
  },
});

/**
 * Get all events (for migration validation)
 *
 * This query is used by the migration script to validate data integrity.
 * Regular app usage should use more specific queries instead.
 */
export const getAllForMigration = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

/**
 * Get all events with attendee counts
 *
 * This is the equivalent of the tRPC `allEvents` query.
 */
export const allEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();

    // For each event, count attendees
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const attendees = await ctx.db
          .query("attendees")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        return {
          _id: event._id,
          name: event.name,
          date: event.date,
          capacity: event.capacity,
          attendeeCount: attendees.length,
        };
      })
    );

    return eventsWithCounts;
  },
});

/**
 * Get a single event with full attendee details
 *
 * This is the equivalent of the tRPC `getEventWithAttendees` query.
 */
export const getEventWithAttendees = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      return null;
    }

    const attendees = await ctx.db
      .query("attendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return {
      _id: event._id,
      name: event.name,
      date: event.date,
      capacity: event.capacity,
      attendees: attendees.map((attendee) => ({
        _id: attendee._id,
        name: attendee.name,
        email: attendee.email,
        checkedIn: attendee.checkedIn,
        checkedInAt: attendee.checkedInAt,
      })),
    };
  },
});

/**
 * Create a new event
 *
 * This is the equivalent of the tRPC `events.create` mutation.
 */
export const create = mutation({
  args: {
    name: v.string(),
    date: v.number(),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("events", {
      name: args.name,
      date: args.date,
      capacity: args.capacity,
      createdAt: Date.now(),
    });

    return eventId;
  },
});
