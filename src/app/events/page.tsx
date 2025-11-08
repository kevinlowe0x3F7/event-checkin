"use client";

import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";

export default function EventsPage() {
  const events = useQuery(api.events.allEvents);

  const innerContent =
    events == null ? (
      <div className="text-lg">Loading events...</div>
    ) : (
      <>
        <Link href="/events/new" className="mb-4 text-sm hover:text-gray-300">
          + New Event
        </Link>
        <h1 className="mb-8 text-4xl font-bold">Events</h1>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              href={`/events/${event._id}`}
              key={event._id}
              className="rounded-lg bg-white p-4 shadow-md hover:bg-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-800">{event.name}</h2>
              <p className="text-sm text-gray-500">
                {new Date(event.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Capacity: {event.capacity}
              </p>
              <p className="text-sm text-gray-500">
                Attendees: {event.attendeeCount}
              </p>
            </Link>
          ))}
        </ul>
      </>
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      {innerContent}
    </div>
  );
}
