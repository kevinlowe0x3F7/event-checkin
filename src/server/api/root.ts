/**
 * Root tRPC router
 *
 * All routers added to this root router are exposed to the client.
 * This is your API's entry point.
 */

import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { checkinRouter } from "~/server/api/routers/checkin";
import { eventsRouter } from "~/server/api/routers/events";
import { attendeesRouter } from "~/server/api/routers/attendees";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 *
 * Example structure:
 * - /api/checkin/checkIn        -> checkin.checkIn
 * - /api/checkin/getAttendee    -> checkin.getAttendee
 * - /api/events/create          -> events.create
 */
export const appRouter = createTRPCRouter({
  checkin: checkinRouter,
  events: eventsRouter,
  attendees: attendeesRouter,
});

// Export type definition of API - this is what gives you type safety!
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * Useful for server components and server actions.
 *
 * @example
 * const trpc = createCaller({ userId: "user_123", db });
 * const attendee = await trpc.checkin.getAttendee({ id: "..." });
 */
export const createCaller = createCallerFactory(appRouter);
