"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function EventRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use Convex query for real-time updates
  const event = useQuery(api.events.getEventWithAttendees, {
    eventId: id as Id<"events">,
  });

  // Use Convex mutation for registration
  const registerMutation = useMutation(api.attendees.register);

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

  const isFull = event.attendees.length >= event.capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newAttendeeId = await registerMutation({
        eventId: id as Id<"events">,
        name,
        email,
      });

      // Navigate to the ticket page
      router.push(`/events/${id}/attendee/${newAttendeeId}`);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-sm">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Register for Event
        </h1>
        <h2 className="mb-6 text-center text-xl">{event.name}</h2>
        <p className="mb-6 text-center text-sm">
          {event.attendees.length} / {event.capacity} attendees registered
        </p>

        {isFull ? (
          <div className="text-center">
            <p className="mb-4 font-semibold text-red-300">
              This event is full!
            </p>
            <a
              href={`/events/${event._id}`}
              className="text-white underline hover:text-gray-200"
            >
              Back to Event Details
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none"
                placeholder="john@example.com"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>
              <a
                href={`/events/${event._id}`}
                className="flex-1 rounded-lg bg-white/10 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-white/20"
              >
                Cancel
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
