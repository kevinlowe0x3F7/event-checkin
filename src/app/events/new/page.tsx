import { db } from "~/server/db";
import { events } from "../../../server/db/schema";
import { redirect } from "next/navigation";

export default async function NewEventPage() {
  async function createEvent(formData: FormData) {
    "use server";
    const name = formData.get("name");
    const date = formData.get("date");
    const capacity = formData.get("capacity");

    await db.insert(events).values({
      name: name as string,
      date: new Date(date as string),
      capacity: parseInt(capacity as string),
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
