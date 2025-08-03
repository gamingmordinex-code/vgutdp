import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  boolean, 
  jsonb,
  pgEnum,
  uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "faculty", "student"]);
export const courseEnum = pgEnum("course", ["B.Tech", "MCA", "MBA", "M.Tech", "BCA", "BBA"]);
export const notificationTypeEnum = pgEnum("notification_type", ["all", "faculty", "students", "specific_ids"]);
export const documentStatusEnum = pgEnum("document_status", ["pending", "approved", "rejected"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  role: roleEnum("role").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Students table
export const students = pgTable("students", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  enrollmentId: text("enrollment_id").notNull().unique(),
  course: courseEnum("course").notNull(),
  year: integer("year").notNull(),
  batchId: uuid("batch_id").references(() => batches.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Faculty table
export const faculty = pgTable("faculty", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Batches table
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Faculty assignments table
export const facultyAssignments = pgTable("faculty_assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  facultyId: uuid("faculty_id").notNull().references(() => users.id),
  batchId: uuid("batch_id").notNull().references(() => batches.id),
  year: integer("year").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow()
});

// Research documents table
export const researchDocuments = pgTable("research_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").notNull().references(() => users.id),
  batchId: uuid("batch_id").notNull().references(() => batches.id),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  remarks: text("remarks"),
  status: documentStatusEnum("status").default("pending"),
  uploadedAt: timestamp("uploaded_at").defaultNow()
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: uuid("batch_id").notNull().references(() => batches.id),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  data: jsonb("data").notNull(), // JSON object with student_id: present/absent
  submittedBy: uuid("submitted_by").notNull().references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow()
});

// Marks table
export const marks = pgTable("marks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").notNull().references(() => users.id),
  batchId: uuid("batch_id").notNull().references(() => batches.id),
  subject: text("subject").notNull(),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  marks: integer("marks").notNull(),
  submittedBy: uuid("submitted_by").notNull().references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow()
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  toType: notificationTypeEnum("to_type").notNull(),
  recipientIds: text("recipient_ids").array(), // Array of user IDs
  isRead: boolean("is_read").default(false),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// OTP sessions table
export const otpSessions = pgTable("otp_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Pending users table (for admin approval)
export const pendingUsers = pgTable("pending_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  role: roleEnum("role").notNull(),
  // Student specific fields
  enrollmentId: text("enrollment_id"),
  course: courseEnum("course"),
  year: integer("year"),
  // Faculty specific fields  
  designation: text("designation"),
  department: text("department"),
  // Status
  status: text("status").default("pending"), // pending, approved, rejected
  appliedAt: timestamp("applied_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  remarks: text("remarks")
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.userId]
  }),
  faculty: one(faculty, {
    fields: [users.id],
    references: [faculty.userId]
  }),
  facultyAssignments: many(facultyAssignments),
  researchDocuments: many(researchDocuments),
  marksSubmitted: many(marks),
  notificationsCreated: many(notifications)
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id]
  }),
  batch: one(batches, {
    fields: [students.batchId],
    references: [batches.id]
  }),
  researchDocuments: many(researchDocuments),
  marks: many(marks)
}));

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  user: one(users, {
    fields: [faculty.userId],
    references: [users.id]
  }),
  assignments: many(facultyAssignments)
}));

export const batchesRelations = relations(batches, ({ many }) => ({
  students: many(students),
  facultyAssignments: many(facultyAssignments),
  researchDocuments: many(researchDocuments),
  attendance: many(attendance),
  marks: many(marks)
}));

export const facultyAssignmentsRelations = relations(facultyAssignments, ({ one }) => ({
  faculty: one(users, {
    fields: [facultyAssignments.facultyId],
    references: [users.id]
  }),
  batch: one(batches, {
    fields: [facultyAssignments.batchId],
    references: [batches.id]
  })
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentSchema = createInsertSchema(students).omit({
  createdAt: true
});

export const insertFacultySchema = createInsertSchema(faculty).omit({
  createdAt: true
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true
});

export const insertResearchDocumentSchema = createInsertSchema(researchDocuments).omit({
  id: true,
  uploadedAt: true
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  submittedAt: true
});

export const insertMarksSchema = createInsertSchema(marks).omit({
  id: true,
  submittedAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertOtpSessionSchema = createInsertSchema(otpSessions).omit({
  id: true,
  createdAt: true
});

export const insertPendingUserSchema = createInsertSchema(pendingUsers).omit({
  id: true,
  appliedAt: true,
  reviewedAt: true,
  reviewedBy: true
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15)
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  otp: z.string().length(6)
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Faculty = typeof faculty.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type FacultyAssignment = typeof facultyAssignments.$inferSelect;
export type ResearchDocument = typeof researchDocuments.$inferSelect;
export type InsertResearchDocument = z.infer<typeof insertResearchDocumentSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Marks = typeof marks.$inferSelect;
export type InsertMarks = z.infer<typeof insertMarksSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type OtpSession = typeof otpSessions.$inferSelect;
export type InsertOtpSession = z.infer<typeof insertOtpSessionSchema>;
export type PendingUser = typeof pendingUsers.$inferSelect;
export type InsertPendingUser = z.infer<typeof insertPendingUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type VerifyOtpData = z.infer<typeof verifyOtpSchema>;
