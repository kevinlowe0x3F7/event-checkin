import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Check in an attendee
 *
 * This is the equivalent of the tRPC `checkin.checkIn` mutation.
 */
export const checkIn = mutation({
  args: {
    attendeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const attendee = await ctx.db
      .query("attendees")
      .withIndex("by_id", (q) =>
        q.eq("_id", args.attendeeId as Id<"attendees">),
      )
      .first();

    if (!attendee) {
      throw new ConvexError("Attendee not found");
    }

    // Check if already checked in
    if (attendee.checkedIn) {
      return {
        success: true,
        alreadyCheckedIn: true,
        attendee: {
          name: attendee.name,
          email: attendee.email,
          checkedInAt: attendee.checkedInAt,
        },
      };
    }

    // Update attendee
    await ctx.db.patch(attendee._id, {
      checkedIn: true,
      checkedInAt: Date.now(),
    });

    return {
      success: true,
      alreadyCheckedIn: false,
      attendee: {
        name: attendee.name,
        email: attendee.email,
        checkedInAt: attendee.checkedInAt,
      },
    };
  },
});

/**
 * Get attendee info (for check-in preview)
 *
 * This is the equivalent of the tRPC `checkin.getAttendee` query.
 */
export const getAttendee = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const attendee = await ctx.db
      .query("attendees")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .first();

    if (!attendee) {
      return null;
    }

    const event = await ctx.db
      .query("events")
      .withIndex("by_id", (q) => q.eq("_id", attendee.eventId))
      .first();

    return {
      _id: attendee._id,
      name: attendee.name,
      email: attendee.email,
      eventId: attendee.eventId,
      eventName: event?.name ?? "Unknown Event",
      checkedIn: attendee.checkedIn,
      checkedInAt: attendee.checkedInAt,
    };
  },
});
