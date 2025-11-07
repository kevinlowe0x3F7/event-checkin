import { redirect } from "next/navigation";
import { db } from "../../../../server/db";
import { attendees, events } from "../../../../server/db/schema";
import { eq, and } from "drizzle-orm";
import CheckInScanner from "./CheckInScanner";
import { revalidatePath } from "next/cache";

async function checkInAttendee(attendeeId: string, eventId: string) {
  "use server";

  try {
    // Find the attendee
    const attendee = await db.query.attendees.findFirst({
      where: and(eq(attendees.id, attendeeId), eq(attendees.eventId, eventId)),
    });

    if (!attendee) {
      return { success: false, error: "Attendee not found" };
    }

    // Check if already checked in
    if (attendee.checkedIn) {
      return {
        success: true,
        alreadyCheckedIn: true,
        attendee: {
          name: attendee.name,
          email: attendee.email,
          checkedInAt: attendee.checkedInAt,
        },
      };
    }

    // Update check-in status
    await db
      .update(attendees)
      .set({
        checkedIn: true,
        checkedInAt: new Date(),
      })
      .where(eq(attendees.id, attendeeId));

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/attendee/${attendeeId}`);

    return {
      success: true,
      alreadyCheckedIn: false,
      attendee: {
        name: attendee.name,
        email: attendee.email,
      },
    };
  } catch (error) {
    console.error("Check-in error:", error);
    return { success: false, error: "Failed to check in" };
  }
}

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attendeeId?: string }>;
}) {
  const { id } = await params;
  const { attendeeId } = await searchParams;

  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) {
    redirect("/events");
  }

  // If attendeeId is provided in URL (from QR code scan), auto check-in
  if (attendeeId) {
    const result = await checkInAttendee(attendeeId, id);

    if (result.success && result.attendee) {
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
