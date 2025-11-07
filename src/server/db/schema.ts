// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `event-checkin_${name}`);

export const events = createTable("events", (d) => ({
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text("name").notNull(),
  date: d.timestamp("date").notNull(),
  capacity: d.integer("capacity").notNull(),
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
}));

export const attendees = createTable("attendees", (d) => ({
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.text("name").notNull(),
  email: d.text("email").notNull(),
  eventId: d
    .text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  qrCode: d.text("qr_code").notNull().unique(),
  checkedIn: d.boolean("checked_in").default(false).notNull(),
  checkedInAt: d.timestamp("checked_in_at"),
  createdAt: d.timestamp("created_at").defaultNow().notNull(),
}));
