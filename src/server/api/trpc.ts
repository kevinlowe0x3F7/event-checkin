/**
 * tRPC initialization and context setup
 * This is the foundation of your tRPC API
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "~/server/db";
import { auth } from "@clerk/nextjs/server";

/**
 * 1. CONTEXT
 *
 * This is where you define what's available in all your tRPC procedures.
 * Think of it as dependency injection for your API routes.
 *
 * Common things to add:
 * - Database instance
 * - Authentication info
 * - Request headers
 */

/**
 * Inner context - used for server components
 */
export const createInnerTRPCContext = async () => {
  const session = await auth();

  return {
    db,                    // Drizzle database instance
    userId: session.userId, // Clerk user ID (null if not authenticated)
  };
};

/**
 * API route context - used for HTTP requests
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const innerContext = await createInnerTRPCContext();

  return {
    ...innerContext,
    ...opts, // Request headers, etc.
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where we initialize tRPC with:
 * - superjson: Allows Date, Map, Set to be serialized properly
 * - Error formatting: Makes Zod validation errors readable
 */
const t = initTRPC.context<Awaited<ReturnType<typeof createInnerTRPCContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE BUILDERS
 *
 * These are the building blocks you'll use to create your API
 */

// Create routers (collections of procedures)
export const createTRPCRouter = t.router;

// Create a caller (for server-side calls)
export const createCallerFactory = t.createCallerFactory;

/**
 * Public procedure - anyone can call this
 *
 * Use this for endpoints that don't require authentication
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 *
 * Automatically throws an error if user is not signed in
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      // ✅ userId is guaranteed to be non-null here
      userId: ctx.userId,
    },
  });
});
