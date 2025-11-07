/**
 * Check-in router
 *
 * Handles QR code check-ins with full type safety
 */

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { attendees } from "~/server/db/schema";

export const checkinRouter = createTRPCRouter({
  /**
   * Check in an attendee
   *
   * This is a MUTATION - it changes data
   *
   * Compare to the server action version:
   * - ✅ Input is validated with Zod automatically
   * - ✅ Output type is inferred on the client
   * - ✅ Full autocomplete in your IDE
   * - ✅ Refactor-safe (rename fields, get compile errors)
   */
  checkIn: publicProcedure
    .input(
      z.object({
        attendeeId: z.string().uuid(),
        eventId: z.string().uuid(),
      })
    )
    .output(
      z.discriminatedUnion("success", [
        // Success case
        z.object({
          success: z.literal(true),
          alreadyCheckedIn: z.boolean(),
          attendee: z.object({
            name: z.string(),
            email: z.string(),
            checkedInAt: z.date().nullable(),
          }),
        }),
        // Error case
        z.object({
          success: z.literal(false),
          error: z.string(),
        }),
      ])
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the attendee
        const attendee = await ctx.db.query.attendees.findFirst({
          where: and(
            eq(attendees.id, input.attendeeId),
            eq(attendees.eventId, input.eventId)
          ),
        });

        if (!attendee) {
          return { success: false, error: "Attendee not found" };
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

        // Update check-in status
        await ctx.db
          .update(attendees)
          .set({
            checkedIn: true,
            checkedInAt: new Date(),
          })
          .where(eq(attendees.id, input.attendeeId));

        return {
          success: true,
          alreadyCheckedIn: false,
          attendee: {
            name: attendee.name,
            email: attendee.email,
            checkedInAt: new Date(),
          },
        };
      } catch (error) {
        console.error("Check-in error:", error);
        return { success: false, error: "Failed to check in" };
      }
    }),

  /**
   * Get attendee details
   *
   * This is a QUERY - it just reads data
   *
   * Useful for showing attendee info before check-in
   */
  getAttendee: publicProcedure
    .input(
      z.object({
        attendeeId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendee = await ctx.db.query.attendees.findFirst({
        where: eq(attendees.id, input.attendeeId),
      });

      if (!attendee) {
        return null;
      }

      return {
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        checkedIn: attendee.checkedIn,
        checkedInAt: attendee.checkedInAt,
        eventId: attendee.eventId,
      };
    }),
});
