import { redirect } from "next/navigation";
import { createCaller } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc";

export default async function NewEventPage() {
  async function createEvent(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const date = formData.get("date") as string;
    const capacity = formData.get("capacity") as string;

    // Use tRPC mutation instead of direct DB access
    const trpc = createCaller(await createInnerTRPCContext());
    await trpc.events.create({
      name,
      date: new Date(date),
      capacity: parseInt(capacity),
    });

    redirect("/events");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <h1 className="mb-8 text-4xl font-bold">New Event</h1>
      <form className="flex flex-col gap-4" action={createEvent}>
        <input type="text" placeholder="Event Name" name="name" />
        <input type="date" placeholder="Event Date" name="date" />
        <input type="number" placeholder="Event Capacity" name="capacity" />
        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}
