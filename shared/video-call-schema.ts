import { pgTable, serial, integer, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Video calls table
export const videoCalls = pgTable("video_calls", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  roomId: varchar("room_id", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"), // scheduled, active, ended, cancelled
  scheduledTime: timestamp("scheduled_time").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  callNotes: text("call_notes"),
  recordingUrl: varchar("recording_url", { length: 500}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Call participants for tracking connection status
export const callParticipants = pgTable("call_participants", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull().references(() => videoCalls.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).notNull(), // patient, doctor
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  connectionStatus: varchar("connection_status", { length: 20 }).default("offline"), // online, offline, reconnecting
  audioEnabled: boolean("audio_enabled").default(true),
  videoEnabled: boolean("video_enabled").default(true),
});

// Chat messages during video calls
export const callMessages = pgTable("call_messages", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull().references(() => videoCalls.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, file, image
  timestamp: timestamp("timestamp").defaultNow(),
});

export type VideoCall = typeof videoCalls.$inferSelect;
export type InsertVideoCall = typeof videoCalls.$inferInsert;
export type CallParticipant = typeof callParticipants.$inferSelect;
export type InsertCallParticipant = typeof callParticipants.$inferInsert;
export type CallMessage = typeof callMessages.$inferSelect;
export type InsertCallMessage = typeof callMessages.$inferInsert;

export const insertVideoCallSchema = createInsertSchema(videoCalls);
export const insertCallParticipantSchema = createInsertSchema(callParticipants);
export const insertCallMessageSchema = createInsertSchema(callMessages);