import {
  pgTable,
  text,
  serial,
  timestamp,
  varchar,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Job status options
export const JobStatus = {
  LEAD: "lead",
  QUOTED: "quoted",
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  PAID: "paid",
} as const;

export type JobStatusType = typeof JobStatus[keyof typeof JobStatus];

// Client table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(), // Add userId to associate clients with specific users
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 100 }),
  addressLine1: varchar("address_line1", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  status: varchar("status", { length: 20 })
    .notNull()
    .$type<JobStatusType>()
    .default(JobStatus.LEAD),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  clientId: serial("client_id")
    .notNull()
    .references(() => clients.id),
  text: text("text").notNull(),
  photoUrl: text("photo_url"),
  voiceUrl: text("voice_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

// Followups table
export const followups = pgTable("followups", {
  id: serial("id").primaryKey(),
  clientId: serial("client_id")
    .notNull()
    .references(() => clients.id),
  action: text("action").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  reminder: boolean("reminder").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFollowupSchema = createInsertSchema(followups).omit({
  id: true,
  createdAt: true,
});

// Type definitions for the tables
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Followup = typeof followups.$inferSelect & {
  clientName?: string;
};
export type InsertFollowup = z.infer<typeof insertFollowupSchema>;
