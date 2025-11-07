import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "../../../server/db";
import { attendees, events } from "../../../server/db/schema";
import { eq } from "drizzle-orm";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    redirect("/events");
  }

  const attenders = await db.query.attendees.findMany({
    where: eq(attendees.eventId, event.id),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <h1 className="mb-8 text-4xl font-bold">Event Details</h1>
      <h2 className="text-2xl font-bold">Event: {event.name}</h2>
      <p className="text-sm">Date: {event.date.toLocaleDateString()}</p>
      <p className="text-sm">Capacity: {event.capacity} attendees</p>
      <p className="text-sm">Attendees: {attenders.length}</p>

      <div className="flex gap-4 mt-4 mb-8">
        <Link
          href={`/events/${event.id}/register`}
          className="rounded-lg bg-white px-6 py-3 text-purple-700 font-semibold hover:bg-gray-100 transition-colors"
        >
          Register for Event
        </Link>
        <Link
          href={`/events/${event.id}/checkin`}
          className="rounded-lg bg-green-500 px-6 py-3 text-white font-semibold hover:bg-green-600 transition-colors"
        >
          Check-In Scanner
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {attenders.map((attender) => (
          <li key={attender.id}>
            <p className="text-sm">Name: {attender.name}</p>
            <p className="text-sm">Email: {attender.email}</p>
            <p className="text-sm">
              Checked In: {attender.checkedIn ? "Yes" : "No"}
            </p>
            {attender.checkedInAt && (
              <p className="text-sm">
                Checked In At: {attender.checkedInAt.toLocaleString()}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
