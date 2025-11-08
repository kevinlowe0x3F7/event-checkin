"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Use Convex query for real-time updates
  const event = useQuery(api.events.getEventWithAttendees, {
    eventId: id as Id<"events">,
  });

  // Loading state
  if (event === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
        <div className="text-lg">Loading event...</div>
      </div>
    );
  }

  // Not found state
  if (event === null) {
    router.push("/events");
    return null;
  }

  const attenders = event.attendees;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <h1 className="mb-8 text-4xl font-bold">Event Details</h1>
      <h2 className="text-2xl font-bold">Event: {event.name}</h2>
      <p className="text-sm">
        Date: {new Date(event.date).toLocaleDateString()}
      </p>
      <p className="text-sm">Capacity: {event.capacity} attendees</p>
      <p className="text-sm">Attendees: {attenders.length}</p>

      <div className="mt-4 mb-8 flex gap-4">
        <Link
          href={`/events/${event._id}/register`}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 transition-colors hover:bg-gray-100"
        >
          Register for Event
        </Link>
        <Link
          href={`/events/${event._id}/checkin`}
          className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-600"
        >
          Check-In Scanner
        </Link>
      </div>

      {attenders.length > 0 ? (
        <div className="w-full max-w-6xl overflow-x-auto">
          <table className="w-full rounded-lg bg-white/10 backdrop-blur-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Checked In
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Checked In At
                </th>
              </tr>
            </thead>
            <tbody>
              {attenders.map((attender) => (
                <tr key={attender._id} className="border-b border-white/10">
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/events/${event._id}/attendee/${attender._id}`}
                      className="block transition-colors hover:text-purple-300"
                    >
                      {attender.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/events/${event._id}/attendee/${attender._id}`}
                      className="block transition-colors hover:text-purple-300"
                    >
                      {attender.email}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/events/${event._id}/attendee/${attender._id}`}
                      className="block transition-colors hover:text-purple-300"
                    >
                      {attender.checkedIn ? (
                        <span className="text-green-300">✓ Yes</span>
                      ) : (
                        <span className="text-yellow-300">✗ No</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/events/${event._id}/attendee/${attender._id}`}
                      className="block transition-colors hover:text-purple-300"
                    >
                      {attender.checkedInAt
                        ? new Date(attender.checkedInAt).toLocaleString()
                        : "-"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-white/60">No attendees registered yet.</p>
      )}
    </div>
  );
}
