import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  authProvider: text("auth_provider"), // 'google', 'facebook', null for local
  authProviderId: text("auth_provider_id"), // OAuth provider user ID
  role: text("role").default("patient").notNull(),
  name: text("name"),
  active: boolean("active").default(true).notNull(),
  currentSessionId: text("current_session_id"), // Track active session
  createdAt: timestamp("created_at").defaultNow(),
});

// User sessions table for tracking active sessions
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  isActive: boolean("is_active").default(true).notNull(),
  loginTime: timestamp("login_time").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  logoutTime: timestamp("logout_time"),
});

export const userRelations = relations(users, ({ many }) => ({
  patients: many(patients),
}));

// Patients table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  pid: text("pid").notNull(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  allergies: text("allergies"),
  lastVisitDate: text("last_visit_date"),
  nextVisitDate: text("next_visit_date"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patientRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  prescriptions: many(prescriptions),
  skinAnalyses: many(skinAnalyses),
  questionnaires: many(questionnaires),
}));

// Hospitals table
export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").default("Dermatologist").notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  phone: text("phone"),
  email: text("email"),
  experience: text("experience"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctorRelations = relations(doctors, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [doctors.hospitalId],
    references: [hospitals.id],
  }),
  appointments: many(appointments),
}));

export const hospitalRelations = relations(hospitals, ({ many }) => ({
  doctors: many(doctors),
  appointments: many(appointments),
}));

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointmentRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  hospital: one(hospitals, {
    fields: [appointments.hospitalId],
    references: [hospitals.id],
  }),
}));

// Medications table
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  dosage: text("dosage"),
  sideEffects: text("side_effects"),
  price: text("price"),
  inStock: boolean("in_stock").default(true),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicationRelations = relations(medications, ({ many }) => ({
  prescriptionItems: many(prescriptionItems),
}));

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  date: text("date").notNull(),
  items: json("items").notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prescriptionRelations = relations(prescriptions, ({ one, many }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  items: many(prescriptionItems),
}));

// Prescription Items table
export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id).notNull(),
  medicationId: integer("medication_id").references(() => medications.id).notNull(),
  dosage: text("dosage").notNull(),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prescriptionItemRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionItems.prescriptionId],
    references: [prescriptions.id],
  }),
  medication: one(medications, {
    fields: [prescriptionItems.medicationId],
    references: [medications.id],
  }),
}));

// Skin Analyses table
export const skinAnalyses = pgTable("skin_analyses", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  imageUrl: text("image_url").notNull(),
  processedImageUrl: text("processed_image_url"),
  imageType: text("image_type").default("skin").notNull(),
  bodyPart: text("body_part"),
  results: json("results").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  validationStatus: text("validation_status").default("pending").notNull(), // pending, approved, modified, rejected
  expertResults: json("expert_results"), // Final expert-validated results
  expertComments: text("expert_comments"),
  reviewedAt: timestamp("reviewed_at"),
  aiResults: json("ai_results"), // Original AI analysis results
  finalResults: json("final_results"), // Results to show to patient (expert or AI)
});

export const skinAnalysisRelations = relations(skinAnalyses, ({ one }) => ({
  patient: one(patients, {
    fields: [skinAnalyses.patientId],
    references: [patients.id],
  }),
}));

// Questionnaires table
export const questionnaires = pgTable("questionnaires", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  questionnaireType: text("questionnaire_type").notNull(), // "skin", "hair", "antiaging"
  age: text("age").notNull(),
  gender: text("gender").notNull(),
  concerns: json("concerns").notNull(), // Array of concern IDs
  routineLevel: text("routine_level").notNull(),
  allergies: text("allergies"),
  hasAllergies: boolean("has_allergies").default(false),
  currentProducts: json("current_products").notNull(), // Array of product IDs
  washFrequency: text("wash_frequency"), // For hair questionnaires
  heatStyling: boolean("heat_styling"), // For hair questionnaires
  chemicalTreatments: boolean("chemical_treatments"), // For hair questionnaires
  dietType: text("diet_type").notNull(),
  exerciseFrequency: text("exercise_frequency").notNull(),
  stressLevel: text("stress_level").notNull(),
  urbanEnvironment: boolean("urban_environment").default(false),
  smoker: boolean("smoker").default(false),
  productPreferences: text("product_preferences").notNull(),
  budgetRange: text("budget_range").notNull(),
  additionalInfo: text("additional_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionnaireRelations = relations(questionnaires, ({ one }) => ({
  patient: one(patients, {
    fields: [questionnaires.patientId],
    references: [patients.id],
  }),
}));

// Analysis Validation table for expert review
export const analysisValidations = pgTable("analysis_validations", {
  id: serial("id").primaryKey(),
  skinAnalysisId: integer("skin_analysis_id").references(() => skinAnalyses.id).notNull(),
  expertId: integer("expert_id").references(() => users.id).notNull(),
  aiResults: json("ai_results").notNull(), // Original AI analysis
  expertResults: json("expert_results"), // Expert-modified results
  status: text("status").default("pending").notNull(), // pending, approved, modified, rejected
  expertComments: text("expert_comments"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysisValidationRelations = relations(analysisValidations, ({ one }) => ({
  skinAnalysis: one(skinAnalyses, {
    fields: [analysisValidations.skinAnalysisId],
    references: [skinAnalyses.id],
  }),
  expert: one(users, {
    fields: [analysisValidations.expertId],
    references: [users.id],
  }),
}));

// Medical Questionnaire for skin analysis
export const medicalQuestionnaires = pgTable("medical_questionnaires", {
  id: serial("id").primaryKey(),
  skinAnalysisId: integer("skin_analysis_id").references(() => skinAnalyses.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  chiefComplaint: text("chief_complaint").notNull(),
  complaintDuration: text("complaint_duration").notNull(),
  previousMedications: text("previous_medications"),
  currentMedications: text("current_medications"),
  comorbidities: text("comorbidities"),
  familyHistory: text("family_history"),
  smokingHistory: boolean("smoking_history").default(false),
  alcoholHistory: boolean("alcohol_history").default(false),
  additionalSymptoms: text("additional_symptoms"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalQuestionnaireRelations = relations(medicalQuestionnaires, ({ one }) => ({
  skinAnalysis: one(skinAnalyses, {
    fields: [medicalQuestionnaires.skinAnalysisId],
    references: [skinAnalyses.id],
  }),
  patient: one(patients, {
    fields: [medicalQuestionnaires.patientId],
    references: [patients.id],
  }),
}));

// Expert Notifications table
export const expertNotifications = pgTable("expert_notifications", {
  id: serial("id").primaryKey(),
  expertId: integer("expert_id").references(() => users.id).notNull(),
  analysisValidationId: integer("analysis_validation_id").references(() => analysisValidations.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  priority: text("priority").default("normal").notNull(), // low, normal, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
});

export const expertNotificationRelations = relations(expertNotifications, ({ one }) => ({
  expert: one(users, {
    fields: [expertNotifications.expertId],
    references: [users.id],
  }),
  analysisValidation: one(analysisValidations, {
    fields: [expertNotifications.analysisValidationId],
    references: [analysisValidations.id],
  }),
}));

// Zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertHospitalSchema = createInsertSchema(hospitals).omit({ id: true, createdAt: true });
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true, createdAt: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true, createdAt: true });
export const insertPrescriptionItemSchema = createInsertSchema(prescriptionItems).omit({ id: true, createdAt: true });
export const insertSkinAnalysisSchema = createInsertSchema(skinAnalyses).omit({ id: true, createdAt: true });
export const insertQuestionnaireSchema = createInsertSchema(questionnaires).omit({ id: true, createdAt: true });
export const insertAnalysisValidationSchema = createInsertSchema(analysisValidations).omit({ id: true, createdAt: true, reviewedAt: true });
export const insertMedicalQuestionnaireSchema = createInsertSchema(medicalQuestionnaires).omit({ id: true, createdAt: true });
export const insertExpertNotificationSchema = createInsertSchema(expertNotifications).omit({ id: true, createdAt: true });

// Video calls schema - Added after expert notifications
export const videoCalls = pgTable("video_calls", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => users.id),
  roomId: varchar("room_id", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  scheduledTime: timestamp("scheduled_time").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  callNotes: text("call_notes"),
  recordingUrl: varchar("recording_url", { length: 500}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const callParticipants = pgTable("call_participants", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull().references(() => videoCalls.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).notNull(),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  connectionStatus: varchar("connection_status", { length: 20 }).default("offline"),
  audioEnabled: boolean("audio_enabled").default(true),
  videoEnabled: boolean("video_enabled").default(true),
});

export const callMessages = pgTable("call_messages", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull().references(() => videoCalls.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertVideoCallSchema = createInsertSchema(videoCalls);
export const insertCallParticipantSchema = createInsertSchema(callParticipants);
export const insertCallMessageSchema = createInsertSchema(callMessages);
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, loginTime: true, lastActivity: true });

// Custom schema for returning analysis results
export const analysisResultSchema = z.object({
  condition: z.string(),
  confidence: z.number(),
  severity: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  possibleCauses: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  bestPractices: z.array(z.string()).optional(),
  treatmentOptions: z.array(z.string()).optional(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type PrescriptionItem = typeof prescriptionItems.$inferSelect;
export type InsertPrescriptionItem = z.infer<typeof insertPrescriptionItemSchema>;

export type SkinAnalysis = typeof skinAnalyses.$inferSelect;
export type InsertSkinAnalysis = z.infer<typeof insertSkinAnalysisSchema>;

export type Questionnaire = typeof questionnaires.$inferSelect;
export type InsertQuestionnaire = z.infer<typeof insertQuestionnaireSchema>;

export type AnalysisValidation = typeof analysisValidations.$inferSelect;
export type InsertAnalysisValidation = z.infer<typeof insertAnalysisValidationSchema>;

export type MedicalQuestionnaire = typeof medicalQuestionnaires.$inferSelect;
export type InsertMedicalQuestionnaire = z.infer<typeof insertMedicalQuestionnaireSchema>;

export type ExpertNotification = typeof expertNotifications.$inferSelect;
export type InsertExpertNotification = z.infer<typeof insertExpertNotificationSchema>;

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type SkinAnalysisWithResults = SkinAnalysis & { analysisResult?: AnalysisResult };

export type VideoCall = typeof videoCalls.$inferSelect;
export type InsertVideoCall = typeof videoCalls.$inferInsert;
export type CallParticipant = typeof callParticipants.$inferSelect;
export type InsertCallParticipant = typeof callParticipants.$inferInsert;
export type CallMessage = typeof callMessages.$inferSelect;
export type InsertCallMessage = typeof callMessages.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;