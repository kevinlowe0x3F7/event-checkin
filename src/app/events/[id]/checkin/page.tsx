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
      where: and(
        eq(attendees.id, attendeeId),
        eq(attendees.eventId, eventId)
      ),
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

    if (result.success) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white p-4">
          <div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-sm text-center">
            <div className="text-6xl mb-4">
              {result.alreadyCheckedIn ? "ℹ️" : "✅"}
            </div>
            <h1 className="mb-4 text-3xl font-bold">
              {result.alreadyCheckedIn ? "Already Checked In" : "Check-In Successful!"}
            </h1>
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <p className="text-xl font-semibold">{result.attendee.name}</p>
              <p className="text-sm text-white/80">{result.attendee.email}</p>
              {result.attendee.checkedInAt && (
                <p className="text-xs text-white/60 mt-2">
                  Checked in at: {new Date(result.attendee.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
            <p className="text-lg mb-6">Welcome to {event.name}!</p>
            <a
              href={`/events/${event.id}`}
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 hover:bg-gray-100 transition-colors"
            >
              View Event Details
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white p-4">
          <div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-sm text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="mb-4 text-3xl font-bold">Check-In Failed</h1>
            <p className="text-lg mb-6">{result.error}</p>
            <a
              href={`/events/${event.id}/checkin`}
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 hover:bg-gray-100 transition-colors"
            >
              Try Again
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white p-4">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold text-center">Check-In Scanner</h1>
        <h2 className="mb-8 text-xl text-center">{event.name}</h2>
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
