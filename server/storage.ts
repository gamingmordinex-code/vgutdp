import { 
  users, 
  students, 
  faculty, 
  batches, 
  facultyAssignments, 
  researchDocuments, 
  attendance, 
  marks, 
  notifications, 
  otpSessions,
  pendingUsers,
  type User, 
  type InsertUser,
  type Student,
  type InsertStudent,
  type Faculty,
  type InsertFaculty,
  type Batch,
  type InsertBatch,
  type FacultyAssignment,
  type ResearchDocument,
  type InsertResearchDocument,
  type Attendance,
  type InsertAttendance,
  type Marks,
  type InsertMarks,
  type Notification,
  type InsertNotification,
  type OtpSession,
  type InsertOtpSession,
  type PendingUser,
  type InsertPendingUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Student operations
  getStudent(userId: string): Promise<Student | undefined>;
  getStudentsByBatch(batchId: string): Promise<Student[]>;
  getUnassignedStudents(year: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(userId: string, updates: Partial<Student>): Promise<Student>;
  getStudentStats(): Promise<{ totalStudents: number; pendingAssignments: number }>;

  // Faculty operations
  getFaculty(userId: string): Promise<Faculty | undefined>;
  getAllFaculty(): Promise<Faculty[]>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  getFacultyWithAssignments(year: number): Promise<Array<Faculty & { assignmentCount: number }>>;

  // Batch operations
  getBatch(id: string): Promise<Batch | undefined>;
  getBatchesByYear(year: number): Promise<Batch[]>;
  getActiveBatches(): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: string, updates: Partial<Batch>): Promise<Batch>;
  getBatchStats(): Promise<{ activeBatches: number }>;

  // Faculty assignment operations
  getFacultyAssignments(facultyId: string, year: number): Promise<FacultyAssignment[]>;
  getBatchAssignments(batchId: string): Promise<FacultyAssignment[]>;
  createFacultyAssignment(assignment: { facultyId: string; batchId: string; year: number }): Promise<FacultyAssignment>;
  deleteFacultyAssignment(facultyId: string, batchId: string): Promise<void>;

  // Research document operations
  getResearchDocuments(studentId: string): Promise<ResearchDocument[]>;
  getResearchDocumentsByBatch(batchId: string): Promise<ResearchDocument[]>;
  createResearchDocument(document: InsertResearchDocument): Promise<ResearchDocument>;
  updateResearchDocument(id: string, updates: Partial<ResearchDocument>): Promise<ResearchDocument>;

  // Attendance operations
  getAttendance(batchId: string, weekNumber: number, year: number): Promise<Attendance | undefined>;
  getBatchAttendance(batchId: string, year: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance>;

  // Marks operations
  getStudentMarks(studentId: string, year: number): Promise<Marks[]>;
  getBatchMarks(batchId: string, weekNumber: number, year: number): Promise<Marks[]>;
  createMarks(marks: InsertMarks): Promise<Marks>;
  updateMarks(id: string, updates: Partial<Marks>): Promise<Marks>;

  // Notification operations
  getNotifications(userId?: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;

  // OTP operations
  createOtpSession(session: InsertOtpSession): Promise<OtpSession>;
  getOtpSession(email: string, phone: string, otp: string): Promise<OtpSession | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;

  // Pending user operations
  createPendingUser(pendingUser: InsertPendingUser): Promise<PendingUser>;
  getPendingUsers(): Promise<PendingUser[]>;
  getPendingUser(id: string): Promise<PendingUser | undefined>;
  approvePendingUser(id: string, adminId: string): Promise<User>;
  rejectPendingUser(id: string, adminId: string, remarks?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Student operations
  async getStudent(userId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student || undefined;
  }

  async getStudentsByBatch(batchId: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.batchId, batchId));
  }

  async getUnassignedStudents(year: number): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(and(eq(students.year, year), sql`${students.batchId} IS NULL`));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(userId: string, updates: Partial<Student>): Promise<Student> {
    const [updatedStudent] = await db
      .update(students)
      .set(updates)
      .where(eq(students.userId, userId))
      .returning();
    return updatedStudent;
  }

  async getStudentStats(): Promise<{ totalStudents: number; pendingAssignments: number }> {
    const [totalStudentsResult] = await db.select({ count: count() }).from(students);
    const [pendingAssignmentsResult] = await db
      .select({ count: count() })
      .from(students)
      .where(sql`${students.batchId} IS NULL`);

    return {
      totalStudents: totalStudentsResult.count,
      pendingAssignments: pendingAssignmentsResult.count
    };
  }

  // Faculty operations
  async getFaculty(userId: string): Promise<Faculty | undefined> {
    const [facultyMember] = await db.select().from(faculty).where(eq(faculty.userId, userId));
    return facultyMember || undefined;
  }

  async getAllFaculty(): Promise<Faculty[]> {
    return await db.select().from(faculty);
  }

  async createFaculty(facultyData: InsertFaculty): Promise<Faculty> {
    const [newFaculty] = await db.insert(faculty).values(facultyData).returning();
    return newFaculty;
  }

  async getFacultyWithAssignments(year: number): Promise<Array<Faculty & { assignmentCount: number }>> {
    const result = await db
      .select({
        userId: faculty.userId,
        designation: faculty.designation,
        department: faculty.department,
        createdAt: faculty.createdAt,
        assignmentCount: count(facultyAssignments.id)
      })
      .from(faculty)
      .leftJoin(facultyAssignments, 
        and(
          eq(faculty.userId, facultyAssignments.facultyId),
          eq(facultyAssignments.year, year)
        )
      )
      .groupBy(faculty.userId, faculty.designation, faculty.department, faculty.createdAt);

    return result;
  }

  // Batch operations
  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch || undefined;
  }

  async getBatchesByYear(year: number): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.year, year));
  }

  async getActiveBatches(): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.isActive, true));
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [newBatch] = await db.insert(batches).values(batch).returning();
    return newBatch;
  }

  async updateBatch(id: string, updates: Partial<Batch>): Promise<Batch> {
    const [updatedBatch] = await db
      .update(batches)
      .set(updates)
      .where(eq(batches.id, id))
      .returning();
    return updatedBatch;
  }

  async getBatchStats(): Promise<{ activeBatches: number }> {
    const [result] = await db
      .select({ count: count() })
      .from(batches)
      .where(eq(batches.isActive, true));

    return { activeBatches: result.count };
  }

  // Faculty assignment operations
  async getFacultyAssignments(facultyId: string, year: number): Promise<FacultyAssignment[]> {
    return await db
      .select()
      .from(facultyAssignments)
      .where(and(eq(facultyAssignments.facultyId, facultyId), eq(facultyAssignments.year, year)));
  }

  async getBatchAssignments(batchId: string): Promise<FacultyAssignment[]> {
    return await db
      .select()
      .from(facultyAssignments)
      .where(eq(facultyAssignments.batchId, batchId));
  }

  async createFacultyAssignment(assignment: { facultyId: string; batchId: string; year: number }): Promise<FacultyAssignment> {
    const [newAssignment] = await db
      .insert(facultyAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async deleteFacultyAssignment(facultyId: string, batchId: string): Promise<void> {
    await db
      .delete(facultyAssignments)
      .where(
        and(
          eq(facultyAssignments.facultyId, facultyId),
          eq(facultyAssignments.batchId, batchId)
        )
      );
  }

  // Research document operations
  async getResearchDocuments(studentId: string): Promise<ResearchDocument[]> {
    return await db
      .select()
      .from(researchDocuments)
      .where(eq(researchDocuments.studentId, studentId))
      .orderBy(desc(researchDocuments.uploadedAt));
  }

  async getResearchDocumentsByBatch(batchId: string): Promise<ResearchDocument[]> {
    return await db
      .select()
      .from(researchDocuments)
      .where(eq(researchDocuments.batchId, batchId))
      .orderBy(desc(researchDocuments.uploadedAt));
  }

  async createResearchDocument(document: InsertResearchDocument): Promise<ResearchDocument> {
    const [newDocument] = await db.insert(researchDocuments).values(document).returning();
    return newDocument;
  }

  async updateResearchDocument(id: string, updates: Partial<ResearchDocument>): Promise<ResearchDocument> {
    const [updatedDocument] = await db
      .update(researchDocuments)
      .set(updates)
      .where(eq(researchDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  // Attendance operations
  async getAttendance(batchId: string, weekNumber: number, year: number): Promise<Attendance | undefined> {
    const [attendanceRecord] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.batchId, batchId),
          eq(attendance.weekNumber, weekNumber),
          eq(attendance.year, year)
        )
      );
    return attendanceRecord || undefined;
  }

  async getBatchAttendance(batchId: string, year: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.batchId, batchId), eq(attendance.year, year)))
      .orderBy(attendance.weekNumber);
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance> {
    const [updatedAttendance] = await db
      .update(attendance)
      .set(updates)
      .where(eq(attendance.id, id))
      .returning();
    return updatedAttendance;
  }

  // Marks operations
  async getStudentMarks(studentId: string, year: number): Promise<Marks[]> {
    return await db
      .select()
      .from(marks)
      .where(and(eq(marks.studentId, studentId), eq(marks.year, year)))
      .orderBy(marks.weekNumber);
  }

  async getBatchMarks(batchId: string, weekNumber: number, year: number): Promise<Marks[]> {
    return await db
      .select()
      .from(marks)
      .where(
        and(
          eq(marks.batchId, batchId),
          eq(marks.weekNumber, weekNumber),
          eq(marks.year, year)
        )
      );
  }

  async createMarks(marksData: InsertMarks): Promise<Marks> {
    const [newMarks] = await db.insert(marks).values(marksData).returning();
    return newMarks;
  }

  async updateMarks(id: string, updates: Partial<Marks>): Promise<Marks> {
    const [updatedMarks] = await db
      .update(marks)
      .set(updates)
      .where(eq(marks.id, id))
      .returning();
    return updatedMarks;
  }

  // Notification operations
  async getNotifications(userId?: string): Promise<Notification[]> {
    if (userId) {
      return await db
        .select()
        .from(notifications)
        .where(sql`${notifications.toType} = 'all' OR ${notifications.recipientIds} @> ARRAY[${userId}]`)
        .orderBy(desc(notifications.createdAt));
    }
    
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // OTP operations
  async createOtpSession(session: InsertOtpSession): Promise<OtpSession> {
    const [newSession] = await db.insert(otpSessions).values(session).returning();
    return newSession;
  }

  async getOtpSession(email: string, phone: string, otp: string): Promise<OtpSession | undefined> {
    const [session] = await db
      .select()
      .from(otpSessions)
      .where(
        and(
          eq(otpSessions.email, email),
          eq(otpSessions.phone, phone),
          eq(otpSessions.otp, otp),
          eq(otpSessions.isUsed, false),
          sql`${otpSessions.expiresAt} > NOW()`
        )
      );
    return session || undefined;
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db
      .update(otpSessions)
      .set({ isUsed: true })
      .where(eq(otpSessions.id, id));
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otpSessions)
      .where(sql`${otpSessions.expiresAt} < NOW()`);
  }

  // Pending user operations
  async createPendingUser(pendingUser: InsertPendingUser): Promise<PendingUser> {
    const [newPendingUser] = await db.insert(pendingUsers).values(pendingUser).returning();
    return newPendingUser;
  }

  async getPendingUsers(): Promise<PendingUser[]> {
    return await db
      .select()
      .from(pendingUsers)
      .where(eq(pendingUsers.status, "pending"))
      .orderBy(desc(pendingUsers.appliedAt));
  }

  async getPendingUser(id: string): Promise<PendingUser | undefined> {
    const [pendingUser] = await db.select().from(pendingUsers).where(eq(pendingUsers.id, id));
    return pendingUser || undefined;
  }

  async approvePendingUser(id: string, adminId: string): Promise<User> {
    const pendingUser = await this.getPendingUser(id);
    if (!pendingUser) {
      throw new Error("Pending user not found");
    }

    // Create the actual user
    const newUser = await this.createUser({
      name: pendingUser.name,
      email: pendingUser.email,
      phone: pendingUser.phone,
      role: pendingUser.role,
      isActive: true
    });

    // Create student or faculty record
    if (pendingUser.role === "student" && pendingUser.enrollmentId && pendingUser.course && pendingUser.year) {
      await this.createStudent({
        userId: newUser.id,
        enrollmentId: pendingUser.enrollmentId,
        course: pendingUser.course,
        year: pendingUser.year
      });
    } else if (pendingUser.role === "faculty" && pendingUser.designation && pendingUser.department) {
      await this.createFaculty({
        userId: newUser.id,
        designation: pendingUser.designation,
        department: pendingUser.department
      });
    }

    // Update pending user status
    await db
      .update(pendingUsers)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: adminId
      })
      .where(eq(pendingUsers.id, id));

    return newUser;
  }

  async rejectPendingUser(id: string, adminId: string, remarks?: string): Promise<void> {
    await db
      .update(pendingUsers)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: adminId,
        remarks: remarks || "Application rejected"
      })
      .where(eq(pendingUsers.id, id));
  }
}

export const storage = new DatabaseStorage();
