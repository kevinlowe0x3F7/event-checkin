"use client";

/**
 * Client-side tRPC hooks
 *
 * Import `api` from this file in your components:
 *
 * @example
 * import { api } from "~/trpc/react";
 *
 * function MyComponent() {
 *   const checkIn = api.checkin.checkIn.useMutation();
 *   const attendee = api.checkin.getAttendee.useQuery({ attendeeId: "..." });
 *
 *   // ✅ Full autocomplete and type safety!
 * }
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import superjson from "superjson";
import { type AppRouter } from "~/server/api/root";

/**
 * Create the tRPC hooks - this is what you'll import in components
 */
export const api = createTRPCReact<AppRouter>();

/**
 * Inference helpers for input/output types
 *
 * @example
 * type CheckInInput = RouterInputs['checkin']['checkIn'];
 * type CheckInOutput = RouterOutputs['checkin']['checkIn'];
 */
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Get the base URL for tRPC requests
 */
function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Provider component - wrap your app with this
 *
 * @example
 * <TRPCReactProvider>
 *   <YourApp />
 * </TRPCReactProvider>
 */
export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchLink({
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
