import Link from "next/link";
import { createCaller } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc";

// TypeScript can't infer the proxy type perfectly in server-side callers
// Runtime is safe due to Zod validation in the tRPC router
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
export default async function EventsPage() {
  // Create a server-side tRPC caller
  const trpc = createCaller(await createInnerTRPCContext());

  const events = await trpc.events.allEvents();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <Link href="/events/new" className="mb-4 text-sm hover:text-gray-300">
        + New Event
      </Link>
      <h1 className="mb-8 text-4xl font-bold">Events</h1>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            href={`/events/${event.id}`}
            key={event.id}
            className="rounded-lg bg-white p-4 shadow-md hover:bg-gray-100"
          >
            <h2 className="text-lg font-bold text-gray-800">{event.name}</h2>
            <p className="text-sm text-gray-500">
              {event.date.toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">Capacity: {event.capacity}</p>
            <p className="text-sm text-gray-500">
              Attendees: {event.attendeeCount}
            </p>
          </Link>
        ))}
      </ul>
    </div>
  );
}
