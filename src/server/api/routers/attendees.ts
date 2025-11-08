/**
 * Attendees router
 */

import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { attendees, events } from "~/server/db/schema";

export const attendeesRouter = createTRPCRouter({
  /**
   * Register a new attendee for an event
   *
   * Validates capacity before creating the attendee
   */
  register: publicProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if event exists
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Check capacity
      const attendeeCount = await ctx.db
        .select({ count: count() })
        .from(attendees)
        .where(eq(attendees.eventId, input.eventId));

      const currentCount = attendeeCount[0]?.count ?? 0;

      if (currentCount >= event.capacity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event is at full capacity",
        });
      }

      // Create attendee
      const newAttendee = await ctx.db
        .insert(attendees)
        .values({
          name: input.name,
          email: input.email,
          eventId: input.eventId,
          qrCode: crypto.randomUUID(), // QR code = attendee ID
          checkedIn: false,
        })
        .returning();

      return newAttendee[0];
    }),

  /**
   * Get a single attendee by ID
   */
  getById: publicProcedure
    .input(z.object({ attendeeId: z.string().uuid() }))
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
        eventId: attendee.eventId,
        qrCode: attendee.qrCode,
        checkedIn: attendee.checkedIn,
        checkedInAt: attendee.checkedInAt,
      };
    }),
});
