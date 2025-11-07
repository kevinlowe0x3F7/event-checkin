/**
 * Events router
 */

import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { attendees, events } from "~/server/db/schema";

const EventSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  date: z.date(),
  capacity: z.number(),
  attendeeCount: z.number(),
});

const AttendeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  checkedIn: z.boolean(),
  checkedInAt: z.date().nullable(),
});

const EventWithAttendeesSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  date: z.date(),
  capacity: z.number(),
  attendees: z.array(AttendeeSchema),
});

export const eventsRouter = createTRPCRouter({
  /**
   * Get all events with attendee counts
   *
   * Note: For server-side calls, errors are thrown rather than returned
   * This provides better type inference and is more idiomatic
   */
  allEvents: publicProcedure
    .output(z.array(EventSchema))
    .query(async ({ ctx }) => {
      const events = await ctx.db.query.events.findMany();
      const attendeeCounts = await Promise.all(
        events.map(async (event) => {
          const result = await ctx.db
            .select({ count: count() })
            .from(attendees)
            .where(eq(attendees.eventId, event.id));
          return { eventId: event.id, count: result[0]?.count ?? 0 };
        }),
      );

      const attendeeCountMap = new Map(
        attendeeCounts.map((ac) => [ac.eventId, ac.count]),
      );

      return events.map((event) => ({
        id: event.id,
        name: event.name,
        date: event.date,
        capacity: event.capacity,
        attendeeCount: attendeeCountMap.get(event.id) ?? 0,
      }));
    }),

  /**
   * Get a single event with full attendee details
   *
   * Use this for the event detail page where you need the full attendee list
   */
  getEventWithAttendees: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .output(EventWithAttendeesSchema.nullable())
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
      });

      if (!event) {
        return null;
      }

      const eventAttendees = await ctx.db.query.attendees.findMany({
        where: eq(attendees.eventId, event.id),
      });

      return {
        id: event.id,
        name: event.name,
        date: event.date,
        capacity: event.capacity,
        attendees: eventAttendees.map((attendee) => ({
          id: attendee.id,
          name: attendee.name,
          email: attendee.email,
          checkedIn: attendee.checkedIn,
          checkedInAt: attendee.checkedInAt,
        })),
      };
    }),

  /**
   * Create a new event
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        date: z.date(),
        capacity: z.number().int().positive("Capacity must be positive"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newEvent = await ctx.db.insert(events).values({
        name: input.name,
        date: input.date,
        capacity: input.capacity,
      }).returning();

      return newEvent[0];
    }),
});
