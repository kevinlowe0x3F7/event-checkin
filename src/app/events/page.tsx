import Link from "next/link";
import { db } from "../../server/db";

export default async function EventsPage() {
  const events = await db.query.events.findMany();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <Link href="/events/new" className="mb-4 text-sm hover:text-gray-300">
        + New Event
      </Link>
      <h1 className="mb-8 text-4xl font-bold">Events</h1>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li key={event.id} className="rounded-lg bg-white p-4 shadow-md">
            <h2 className="text-lg font-bold text-gray-800">{event.name}</h2>
            <p className="text-sm text-gray-500">
              {event.date.toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">{event.capacity} attendees</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
