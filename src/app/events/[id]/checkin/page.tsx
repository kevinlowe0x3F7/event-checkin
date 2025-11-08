"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import CheckInScanner from "./CheckInScanner";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const attendeeId = searchParams.get("attendeeId");

  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    alreadyCheckedIn?: boolean;
    attendee?: {
      name: string;
      email: string;
      checkedInAt?: number | null;
    };
    error?: string;
  } | null>(null);

  // Use Convex query to get event
  const event = useQuery(api.events.getEventWithAttendees, {
    eventId: id as Id<"events">,
  });

  const checkInMutation = useMutation(api.checkin.checkIn);

  // If attendeeId is provided in URL (from QR code scan), auto check-in
  useEffect(() => {
    if (attendeeId && event && !checkInResult) {
      void checkInMutation({
        attendeeId: attendeeId as Id<"attendees">,
      }).then((result) => {
        setCheckInResult(result);
      });
    }
  }, [attendeeId, event, checkInMutation, id, checkInResult]);

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

  // If attendeeId is provided in URL (from QR code scan), show result
  if (attendeeId && checkInResult) {
    const result = checkInResult;

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
              <p className="text-xl font-semibold">{result.attendee?.name}</p>
              <p className="text-sm text-white/80">{result.attendee?.email}</p>
              {result.attendee?.checkedInAt && (
                <p className="mt-2 text-xs text-white/60">
                  Checked in at:{" "}
                  {new Date(result.attendee.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
            <p className="mb-6 text-lg">Welcome to {event.name}!</p>
            <a
              href={`/events/${event._id}`}
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
              href={`/events/${event._id}/checkin`}
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
        <CheckInScanner checkInMutation={checkInMutation} />
        <div className="mt-8 text-center">
          <a
            href={`/events/${event._id}`}
            className="text-white underline hover:text-gray-200"
          >
            Back to Event Details
          </a>
        </div>
      </div>
    </div>
  );
}
