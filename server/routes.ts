import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware } from "./middleware/auth";
import { generateOtp, sendOtp } from "./services/otp";
import { createBatchesFromPendingStudents } from "./services/batch";
import { 
  loginSchema, 
  verifyOtpSchema, 
  insertUserSchema, 
  insertStudentSchema, 
  insertFacultySchema,
  insertBatchSchema,
  insertResearchDocumentSchema,
  insertAttendanceSchema,
  insertMarksSchema,
  insertNotificationSchema,
  insertPendingUserSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email, phone } = loginSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify phone matches
      if (existingUser.phone !== phone) {
        return res.status(400).json({ message: "Phone number does not match" });
      }

      // Generate and send OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtpSession({
        email,
        phone,
        otp,
        expiresAt
      });

      await sendOtp(phone, otp);

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, phone, otp } = verifyOtpSchema.parse(req.body);

      const session = await storage.getOtpSession(email, phone, otp);
      if (!session) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await storage.markOtpAsUsed(session.id);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create session (in production, use JWT)
      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({ 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const pendingUserData = insertPendingUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(pendingUserData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const existingPending = await storage.getPendingUsers();
      const emailExists = existingPending.some(p => p.email === pendingUserData.email);
      if (emailExists) {
        return res.status(400).json({ message: "Application with this email already submitted" });
      }

      const pendingUser = await storage.createPendingUser(pendingUserData);
      res.status(201).json({ 
        message: "Application submitted successfully. Admin will review and approve.",
        id: pendingUser.id 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profile = null;
      if (user.role === "student") {
        profile = await storage.getStudent(user.id);
      } else if (user.role === "faculty") {
        profile = await storage.getFaculty(user.id);
      }

      res.json({ user, profile });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const [studentStats, batchStats, facultyCount] = await Promise.all([
        storage.getStudentStats(),
        storage.getBatchStats(),
        storage.getAllFaculty().then(f => f.length)
      ]);

      res.json({
        totalStudents: studentStats.totalStudents,
        totalFaculty: facultyCount,
        activeBatches: batchStats.activeBatches,
        pendingAssignments: studentStats.pendingAssignments
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/students", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);

      // Trigger batch creation logic
      await createBatchesFromPendingStudents(studentData.year);

      res.status(201).json(student);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/faculty", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const facultyData = insertFacultySchema.parse(req.body);
      const faculty = await storage.createFaculty(facultyData);
      res.status(201).json(faculty);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/pending-students/:year", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const year = parseInt(req.params.year);
      const pendingStudents = await storage.getUnassignedStudents(year);
      res.json(pendingStudents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pending users routes
  app.get("/api/admin/pending-users", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/pending-users/:id/approve", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const user = await storage.approvePendingUser(id, req.userId!);
      res.json({ message: "User approved successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/pending-users/:id/reject", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const { remarks } = req.body;
      await storage.rejectPendingUser(id, req.userId!, remarks);
      res.json({ message: "User rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/batches/create", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { year } = req.body;
      const createdBatches = await createBatchesFromPendingStudents(year);
      res.json({ message: `Created ${createdBatches.length} batches`, batches: createdBatches });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/notifications", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        createdBy: req.userId
      });
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Student routes
  app.get("/api/students/dashboard", authMiddleware, async (req, res) => {
    if (req.userRole !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const student = await storage.getStudent(req.userId!);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const [batch, researchDocs, marks, notifications] = await Promise.all([
        student.batchId ? storage.getBatch(student.batchId) : null,
        storage.getResearchDocuments(req.userId!),
        storage.getStudentMarks(req.userId!, student.year),
        storage.getNotifications(req.userId!)
      ]);

      let facultyAssignments: FacultyAssignment[] = [];
      if (student.batchId) {
        facultyAssignments = await storage.getBatchAssignments(student.batchId);
      }

      res.json({
        student,
        batch,
        facultyAssignments,
        researchDocuments: researchDocs,
        marks,
        notifications
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/students/documents", authMiddleware, async (req, res) => {
    if (req.userRole !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const student = await storage.getStudent(req.userId!);
      if (!student || !student.batchId) {
        return res.status(400).json({ message: "Student not assigned to batch" });
      }

      const documentData = insertResearchDocumentSchema.parse({
        ...req.body,
        studentId: req.userId,
        batchId: student.batchId
      });

      const document = await storage.createResearchDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Faculty routes
  app.get("/api/faculty/dashboard", authMiddleware, async (req, res) => {
    if (req.userRole !== "faculty") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const currentYear = new Date().getFullYear();
      const assignments = await storage.getFacultyAssignments(req.userId!, currentYear);
      
      const batchDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const batch = await storage.getBatch(assignment.batchId);
          const students = await storage.getStudentsByBatch(assignment.batchId);
          return { ...batch, students, assignment };
        })
      );

      res.json({
        assignments: batchDetails,
        totalBatches: assignments.length,
        totalStudents: batchDetails.reduce((sum, batch) => sum + batch.students.length, 0)
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/faculty/attendance", authMiddleware, async (req, res) => {
    if (req.userRole !== "faculty") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        submittedBy: req.userId
      });

      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/faculty/marks", authMiddleware, async (req, res) => {
    if (req.userRole !== "faculty") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const marksData = insertMarksSchema.parse({
        ...req.body,
        submittedBy: req.userId
      });

      const marks = await storage.createMarks(marksData);
      res.status(201).json(marks);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/faculty/batch/:batchId/students", authMiddleware, async (req, res) => {
    if (req.userRole !== "faculty") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { batchId } = req.params;
      
      // Verify faculty has access to this batch
      const assignments = await storage.getBatchAssignments(batchId);
      const hasAccess = assignments.some(a => a.facultyId === req.userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }

      const students = await storage.getStudentsByBatch(batchId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Common routes
  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/batches", authMiddleware, async (req, res) => {
    try {
      const batches = await storage.getActiveBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
