import Link from "next/link";
import { db } from "../../server/db";
import { attendees } from "../../server/db/schema";
import { eq, count } from "drizzle-orm";

export default async function EventsPage() {
  const events = await db.query.events.findMany();

  // Fetch attendee counts for all events
  const attendeeCounts = await Promise.all(
    events.map(async (event) => {
      const result = await db
        .select({ count: count() })
        .from(attendees)
        .where(eq(attendees.eventId, event.id));
      return { eventId: event.id, count: result[0]?.count ?? 0 };
    })
  );

  const attendeeCountMap = new Map(
    attendeeCounts.map((ac) => [ac.eventId, ac.count])
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <Link href="/events/new" className="mb-4 text-sm hover:text-gray-300">
        + New Event
      </Link>
      <h1 className="mb-8 text-4xl font-bold">Events</h1>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const attendeeCount = attendeeCountMap.get(event.id) ?? 0;
          return (
            <Link
              href={`/events/${event.id}`}
              key={event.id}
              className="rounded-lg bg-white p-4 shadow-md hover:bg-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-800">{event.name}</h2>
              <p className="text-sm text-gray-500">
                {event.date.toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Capacity: {event.capacity}
              </p>
              <p className="text-sm text-gray-500">
                Attendees: {attendeeCount}
              </p>
            </Link>
          );
        })}
      </ul>
    </div>
  );
}
