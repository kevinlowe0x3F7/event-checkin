import { redirect } from "next/navigation";
import { db } from "../../../../../server/db";
import { attendees, events } from "../../../../../server/db/schema";
import { eq } from "drizzle-orm";
import QRCodeDisplay from "./QRCodeDisplay";

export default async function AttendeePage({
  params,
}: {
  params: Promise<{ id: string; attendeeId: string }>;
}) {
  const { id, attendeeId } = await params;

  const attendee = await db.query.attendees.findFirst({
    where: eq(attendees.id, attendeeId),
  });

  if (attendee?.eventId !== id) {
    redirect("/events");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    redirect("/events");
  }

  // Generate the check-in URL that the QR code will encode
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const checkInUrl = `${baseUrl}/events/${event.id}/checkin?attendeeId=${attendee.id}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] p-4 text-white">
      <div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-sm">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Registration Successful!
        </h1>

        <div className="mb-6 text-center">
          <h2 className="mb-2 text-xl font-semibold">{attendee.name}</h2>
          <p className="text-sm text-white/80">{attendee.email}</p>
          <p className="mt-4 text-lg font-medium">{event.name}</p>
          <p className="text-sm text-white/80">
            {event.date.toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6">
          <QRCodeDisplay url={checkInUrl} />
        </div>

        <div className="space-y-4 text-center">
          <p className="text-sm text-white/90">
            Save this QR code or bookmark this page. Show it at the event to
            check in!
          </p>

          {attendee.checkedIn ? (
            <div className="rounded-lg border border-green-500 bg-green-500/20 p-4">
              <p className="font-semibold text-green-200">✓ Checked In</p>
              {attendee.checkedInAt && (
                <p className="mt-1 text-sm text-green-300">
                  {attendee.checkedInAt.toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-500 bg-yellow-500/20 p-4">
              <p className="text-yellow-200">Not yet checked in</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <a
              href={`/events/${event.id}`}
              className="flex-1 rounded-lg bg-white/10 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/20"
            >
              View Event
            </a>
            <a
              href="/events"
              className="flex-1 rounded-lg bg-white/10 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/20"
            >
              All Events
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
