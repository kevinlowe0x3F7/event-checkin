import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../server/db";
import { attendees } from "../../../server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendeeId, eventId } = body;

    if (!attendeeId || !eventId) {
      return NextResponse.json(
        { error: "Attendee ID and Event ID are required" },
        { status: 400 }
      );
    }

    // Find the attendee
    const attendee = await db.query.attendees.findFirst({
      where: eq(attendees.id, attendeeId),
    });

    if (!attendee) {
      return NextResponse.json(
        { error: "Attendee not found" },
        { status: 404 }
      );
    }

    // Verify the attendee is registered for this event
    if (attendee.eventId !== eventId) {
      return NextResponse.json(
        { error: "Attendee not registered for this event" },
        { status: 403 }
      );
    }

    // Check if already checked in
    if (attendee.checkedIn) {
      return NextResponse.json(
        {
          message: "Already checked in",
          attendee: {
            name: attendee.name,
            email: attendee.email,
            checkedInAt: attendee.checkedInAt,
          },
        },
        { status: 200 }
      );
    }

    // Update check-in status
    await db
      .update(attendees)
      .set({
        checkedIn: true,
        checkedInAt: new Date(),
      })
      .where(eq(attendees.id, attendeeId));

    return NextResponse.json({
      success: true,
      message: "Successfully checked in",
      attendee: {
        name: attendee.name,
        email: attendee.email,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
