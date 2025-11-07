import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCaller } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

async function registerAttendee(formData: FormData) {
  "use server";

  const eventId = formData.get("eventId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  // Use tRPC mutation instead of direct DB access
  const trpc = createCaller(await createInnerTRPCContext());
  const newAttendee = await trpc.attendees.register({
    eventId,
    name,
    email,
  });

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}/attendee/${newAttendee!.id}`);
}

export default async function EventRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use tRPC query instead of direct DB access
  const trpc = createCaller(await createInnerTRPCContext());
  const event = await trpc.events.getEventWithAttendees({ eventId: id });

  if (!event) {
    redirect("/events");
  }

  const isFull = event.attendees.length >= event.capacity;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-sm">
        <h1 className="mb-2 text-3xl font-bold text-center">Register for Event</h1>
        <h2 className="mb-6 text-xl text-center">{event.name}</h2>
        <p className="mb-6 text-center text-sm">
          {event.attendees.length} / {event.capacity} attendees registered
        </p>

        {isFull ? (
          <div className="text-center">
            <p className="mb-4 text-red-300 font-semibold">
              This event is full!
            </p>
            <a
              href={`/events/${event.id}`}
              className="text-white underline hover:text-gray-200"
            >
              Back to Event Details
            </a>
          </div>
        ) : (
          <form action={registerAttendee} className="space-y-4">
            <input type="hidden" name="eventId" value={event.id} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="john@example.com"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 hover:bg-gray-100 transition-colors"
              >
                Register
              </button>
              <a
                href={`/events/${event.id}`}
                className="flex-1 rounded-lg bg-white/10 px-6 py-3 font-semibold text-white text-center hover:bg-white/20 transition-colors"
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
