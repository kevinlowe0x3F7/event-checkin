import { redirect } from "next/navigation";
import { createCaller } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc";
import CheckInScanner from "./CheckInScanner";

async function checkInAttendee(attendeeId: string, eventId: string) {
  "use server";

  // Use tRPC mutation instead of direct DB access
  const trpc = createCaller(await createInnerTRPCContext());
  const result = await trpc.checkin.checkIn({
    attendeeId,
    eventId,
  });

  return result;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attendeeId?: string }>;
}) {
  const { id } = await params;
  const { attendeeId } = await searchParams;

  // Use tRPC query to get event
  const trpc = createCaller(await createInnerTRPCContext());
  const event = await trpc.events.getEventWithAttendees({ eventId: id });

  if (!event) {
    redirect("/events");
  }

  // If attendeeId is provided in URL (from QR code scan), auto check-in
  if (attendeeId) {
    const result = await checkInAttendee(attendeeId, id);

    console.log("result:", result);

    if (result.success) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] p-4 text-white">
          <div className="w-full max-w-md rounded-lg bg-white/10 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 text-6xl">
              {result.alreadyCheckedIn ? "ℹ️" : "✅"}
            </div>
            <h1 className="mb-4 text-3xl font-bold">
              {result.alreadyCheckedIn
                ? "Already Checked In"
                : "Check-In Successful!"}
            </h1>
            <div className="mb-6 rounded-lg bg-white/10 p-4">
              <p className="text-xl font-semibold">{result.attendee.name}</p>
              <p className="text-sm text-white/80">{result.attendee.email}</p>
              {result.attendee.checkedInAt && (
                <p className="mt-2 text-xs text-white/60">
                  Checked in at:{" "}
                  {new Date(result.attendee.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
            <p className="mb-6 text-lg">Welcome to {event.name}!</p>
            <a
              href={`/events/${event.id}`}
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 transition-colors hover:bg-gray-100"
            >
              View Event Details
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] p-4 text-white">
          <div className="w-full max-w-md rounded-lg bg-white/10 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 text-6xl">❌</div>
            <h1 className="mb-4 text-3xl font-bold">Check-In Failed</h1>
            <p className="mb-6 text-lg">{result.error}</p>
            <a
              href={`/events/${event.id}/checkin`}
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 transition-colors hover:bg-gray-100"
            >
              Try Again
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] p-4 text-white">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Check-In Scanner
        </h1>
        <h2 className="mb-8 text-center text-xl">{event.name}</h2>
        <CheckInScanner eventId={event.id} checkInAction={checkInAttendee} />
        <div className="mt-8 text-center">
          <a
            href={`/events/${event.id}`}
            className="text-white underline hover:text-gray-200"
          >
            Back to Event Details
          </a>
        </div>
      </div>
    </div>
  );
}
