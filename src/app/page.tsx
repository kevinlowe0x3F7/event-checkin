import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#6d28d9] to-[#3730a3] text-white">
      <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
        <h1 className="mb-8 text-4xl font-bold">Event Check-in System</h1>
        <p className="mb-4">Version 3: Convex</p>

        <div className="grid grid-cols-1 gap-6">
          <Link
            className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
            href="/events"
          >
            <h3 className="text-2xl font-bold">Events List →</h3>
          </Link>
        </div>
      </div>
    </main>
  );
}
