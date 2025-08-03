import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbService } from "./services/database";
import { authMiddleware } from "./middleware/auth";
import { generateOtp, sendOtp } from "./services/otp";
import { createBatchesFromPendingStudents } from "./services/batch";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15)
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  otp: z.string().length(6)
});

const registrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  role: z.enum(['student', 'faculty']),
  // Student fields
  enrollmentId: z.string().optional(),
  course: z.enum(['B.Tech', 'MCA', 'MBA', 'M.Tech', 'BCA', 'BBA']).optional(),
  year: z.number().min(2020).max(2030).optional(),
  // Faculty fields
  designation: z.string().optional(),
  department: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email, phone } = loginSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await dbService.getUserByEmail(email);
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

      await dbService.createOtpSession({
        email,
        phone,
        otp,
        expiresAt
      });

      await sendOtp(phone, otp);

      res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, phone, otp } = verifyOtpSchema.parse(req.body);

      const session = await dbService.getOtpSession(email, phone, otp);
      if (!session) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await dbService.markOtpAsUsed(session.id);

      const user = await dbService.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create session
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
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const pendingUserData = registrationSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await dbService.getUserByEmail(pendingUserData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const existingPending = await dbService.getPendingUsers();
      const emailExists = existingPending.some(p => p.email === pendingUserData.email);
      if (emailExists) {
        return res.status(400).json({ message: "Application with this email already submitted" });
      }

      const pendingUser = await dbService.createPendingUser({
        ...pendingUserData,
        appliedAt: new Date(),
        status: 'pending'
      });
      
      res.status(201).json({ 
        message: "Application submitted successfully. Admin will review and approve.",
        id: pendingUser.id 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
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
      const user = await dbService.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profile = null;
      if (user.role === "student") {
        profile = await dbService.getStudent(user.id);
      } else if (user.role === "faculty") {
        profile = await dbService.getFaculty(user.id);
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
        dbService.getStudentStats(),
        dbService.getBatchStats(),
        dbService.getAllFaculty().then(f => f.length)
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

  app.get("/api/admin/pending-users", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const pendingUsers = await dbService.getPendingUsers();
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
      const user = await dbService.approvePendingUser(id, req.userId!);
      res.json({ message: "User approved successfully", user });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  app.post("/api/admin/pending-users/:id/reject", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const { id } = req.params;
      const { remarks } = req.body;
      await dbService.rejectPendingUser(id, req.userId!, remarks);
      res.json({ message: "User rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/pending-students/:year", authMiddleware, async (req, res) => {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const year = parseInt(req.params.year);
      const pendingStudents = await dbService.getUnassignedStudents(year);
      res.json(pendingStudents);
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

  // Student routes
  app.get("/api/students/dashboard", authMiddleware, async (req, res) => {
    if (req.userRole !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const student = await dbService.getStudent(req.userId!);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const [batch, researchDocs, marks, notifications] = await Promise.all([
        student.batchId ? dbService.getBatch(student.batchId) : null,
        dbService.getResearchDocuments(req.userId!),
        dbService.getStudentMarks(req.userId!, student.year),
        dbService.getNotifications(req.userId!)
      ]);

      let facultyAssignments: any[] = [];
      if (student.batchId) {
        facultyAssignments = await dbService.getBatchAssignments(student.batchId);
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
      const student = await dbService.getStudent(req.userId!);
      if (!student || !student.batchId) {
        return res.status(400).json({ message: "Student not assigned to batch" });
      }

      const document = await dbService.createResearchDocument({
        ...req.body,
        studentId: req.userId,
        batchId: student.batchId
      });

      res.status(201).json(document);
    } catch (error) {
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
      const assignments = await dbService.getFacultyAssignments(req.userId!, currentYear);
      
      const batchDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const batch = await dbService.getBatch(assignment.batchId);
          const students = await dbService.getStudentsByBatch(assignment.batchId);
          return { ...batch?.toObject(), students, assignment };
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
      const attendance = await dbService.createAttendance({
        ...req.body,
        submittedBy: req.userId
      });

      res.status(201).json(attendance);
    } catch (error) {
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
      const assignments = await dbService.getBatchAssignments(batchId);
      const hasAccess = assignments.some(a => a.facultyId.toString() === req.userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }

      const students = await dbService.getStudentsByBatch(batchId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Common routes
  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const notifications = await dbService.getNotifications(req.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
      await dbService.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/batches", authMiddleware, async (req, res) => {
    try {
      const batches = await dbService.getActiveBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}