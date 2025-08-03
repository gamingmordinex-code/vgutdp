import { User, IUser } from '../models/User';
import { Student, IStudent } from '../models/Student';
import { Faculty, IFaculty } from '../models/Faculty';
import { Batch, IBatch } from '../models/Batch';
import { FacultyAssignment, IFacultyAssignment } from '../models/FacultyAssignment';
import { ResearchDocument, IResearchDocument } from '../models/ResearchDocument';
import { Attendance, IAttendance } from '../models/Attendance';
import { Marks, IMarks } from '../models/Marks';
import { Notification, INotification } from '../models/Notification';
import { OtpSession, IOtpSession } from '../models/OtpSession';
import { PendingUser, IPendingUser } from '../models/PendingUser';
import mongoose from 'mongoose';

export class DatabaseService {
  // User operations
  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async getUserByPhone(phone: string): Promise<IUser | null> {
    return await User.findOne({ phone });
  }

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  // Student operations
  async getStudent(userId: string): Promise<IStudent | null> {
    return await Student.findOne({ userId }).populate('userId batchId');
  }

  async getStudentsByBatch(batchId: string): Promise<IStudent[]> {
    return await Student.find({ batchId }).populate('userId');
  }

  async getUnassignedStudents(year: number): Promise<IStudent[]> {
    return await Student.find({ year, batchId: null }).populate('userId');
  }

  async createStudent(studentData: Partial<IStudent>): Promise<IStudent> {
    const student = new Student(studentData);
    return await student.save();
  }

  async updateStudent(userId: string, updates: Partial<IStudent>): Promise<IStudent | null> {
    return await Student.findOneAndUpdate({ userId }, updates, { new: true });
  }

  async getStudentStats(): Promise<{ totalStudents: number; pendingAssignments: number }> {
    const [totalStudents, pendingAssignments] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ batchId: null })
    ]);

    return { totalStudents, pendingAssignments };
  }

  // Faculty operations
  async getFaculty(userId: string): Promise<IFaculty | null> {
    return await Faculty.findOne({ userId }).populate('userId');
  }

  async getAllFaculty(): Promise<IFaculty[]> {
    return await Faculty.find().populate('userId');
  }

  async createFaculty(facultyData: Partial<IFaculty>): Promise<IFaculty> {
    const faculty = new Faculty(facultyData);
    return await faculty.save();
  }

  async getFacultyWithAssignments(year: number): Promise<Array<IFaculty & { assignmentCount: number }>> {
    const result = await Faculty.aggregate([
      {
        $lookup: {
          from: 'facultyassignments',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$facultyId', '$$userId'] },
                    { $eq: ['$year', year] }
                  ]
                }
              }
            }
          ],
          as: 'assignments'
        }
      },
      {
        $addFields: {
          assignmentCount: { $size: '$assignments' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    return result;
  }

  // Batch operations
  async getBatch(id: string): Promise<IBatch | null> {
    return await Batch.findById(id);
  }

  async getBatchesByYear(year: number): Promise<IBatch[]> {
    return await Batch.find({ year });
  }

  async getActiveBatches(): Promise<IBatch[]> {
    return await Batch.find({ isActive: true });
  }

  async createBatch(batchData: Partial<IBatch>): Promise<IBatch> {
    const batch = new Batch(batchData);
    return await batch.save();
  }

  async updateBatch(id: string, updates: Partial<IBatch>): Promise<IBatch | null> {
    return await Batch.findByIdAndUpdate(id, updates, { new: true });
  }

  async getBatchStats(): Promise<{ activeBatches: number }> {
    const activeBatches = await Batch.countDocuments({ isActive: true });
    return { activeBatches };
  }

  // Faculty assignment operations
  async getFacultyAssignments(facultyId: string, year: number): Promise<IFacultyAssignment[]> {
    return await FacultyAssignment.find({ facultyId, year }).populate('batchId');
  }

  async getBatchAssignments(batchId: string): Promise<IFacultyAssignment[]> {
    return await FacultyAssignment.find({ batchId }).populate('facultyId');
  }

  async createFacultyAssignment(assignmentData: { facultyId: string; batchId: string; year: number }): Promise<IFacultyAssignment> {
    const assignment = new FacultyAssignment(assignmentData);
    return await assignment.save();
  }

  async deleteFacultyAssignment(facultyId: string, batchId: string): Promise<void> {
    await FacultyAssignment.deleteOne({ facultyId, batchId });
  }

  // Research document operations
  async getResearchDocuments(studentId: string): Promise<IResearchDocument[]> {
    return await ResearchDocument.find({ studentId }).sort({ uploadedAt: -1 });
  }

  async getResearchDocumentsByBatch(batchId: string): Promise<IResearchDocument[]> {
    return await ResearchDocument.find({ batchId }).sort({ uploadedAt: -1 }).populate('studentId');
  }

  async createResearchDocument(documentData: Partial<IResearchDocument>): Promise<IResearchDocument> {
    const document = new ResearchDocument(documentData);
    return await document.save();
  }

  async updateResearchDocument(id: string, updates: Partial<IResearchDocument>): Promise<IResearchDocument | null> {
    return await ResearchDocument.findByIdAndUpdate(id, updates, { new: true });
  }

  // Attendance operations
  async getAttendance(batchId: string, weekNumber: number, year: number): Promise<IAttendance | null> {
    return await Attendance.findOne({ batchId, weekNumber, year });
  }

  async getBatchAttendance(batchId: string, year: number): Promise<IAttendance[]> {
    return await Attendance.find({ batchId, year }).sort({ weekNumber: 1 });
  }

  async createAttendance(attendanceData: Partial<IAttendance>): Promise<IAttendance> {
    const attendance = new Attendance(attendanceData);
    return await attendance.save();
  }

  async updateAttendance(id: string, updates: Partial<IAttendance>): Promise<IAttendance | null> {
    return await Attendance.findByIdAndUpdate(id, updates, { new: true });
  }

  // Marks operations
  async getStudentMarks(studentId: string, year: number): Promise<IMarks[]> {
    return await Marks.find({ studentId, year }).sort({ weekNumber: 1 });
  }

  async getBatchMarks(batchId: string, weekNumber: number, year: number): Promise<IMarks[]> {
    return await Marks.find({ batchId, weekNumber, year }).populate('studentId');
  }

  async createMarks(marksData: Partial<IMarks>): Promise<IMarks> {
    const marks = new Marks(marksData);
    return await marks.save();
  }

  async updateMarks(id: string, updates: Partial<IMarks>): Promise<IMarks | null> {
    return await Marks.findByIdAndUpdate(id, updates, { new: true });
  }

  // Notification operations
  async getNotifications(userId?: string): Promise<INotification[]> {
    let query: any = {};
    
    if (userId) {
      query = {
        $or: [
          { toType: 'all' },
          { recipientIds: userId }
        ]
      };
    }
    
    return await Notification.find(query).sort({ createdAt: -1 }).populate('createdBy');
  }

  async createNotification(notificationData: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await Notification.findByIdAndUpdate(id, { isRead: true });
  }

  // OTP operations
  async createOtpSession(sessionData: Partial<IOtpSession>): Promise<IOtpSession> {
    const session = new OtpSession(sessionData);
    return await session.save();
  }

  async getOtpSession(email: string, phone: string, otp: string): Promise<IOtpSession | null> {
    return await OtpSession.findOne({
      email: email.toLowerCase(),
      phone,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await OtpSession.findByIdAndUpdate(id, { isUsed: true });
  }

  async cleanupExpiredOtps(): Promise<void> {
    await OtpSession.deleteMany({ expiresAt: { $lt: new Date() } });
  }

  // Pending user operations
  async createPendingUser(pendingUserData: Partial<IPendingUser>): Promise<IPendingUser> {
    const pendingUser = new PendingUser(pendingUserData);
    return await pendingUser.save();
  }

  async getPendingUsers(): Promise<IPendingUser[]> {
    return await PendingUser.find({ status: 'pending' }).sort({ appliedAt: -1 });
  }

  async getPendingUser(id: string): Promise<IPendingUser | null> {
    return await PendingUser.findById(id);
  }

  async approvePendingUser(id: string, adminId: string): Promise<IUser> {
    const pendingUser = await this.getPendingUser(id);
    if (!pendingUser) {
      throw new Error('Pending user not found');
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
    if (pendingUser.role === 'student' && pendingUser.enrollmentId && pendingUser.course && pendingUser.year) {
      await this.createStudent({
        userId: newUser._id,
        enrollmentId: pendingUser.enrollmentId,
        course: pendingUser.course,
        year: pendingUser.year
      });
    } else if (pendingUser.role === 'faculty' && pendingUser.designation && pendingUser.department) {
      await this.createFaculty({
        userId: newUser._id,
        designation: pendingUser.designation,
        department: pendingUser.department
      });
    }

    // Update pending user status
    await PendingUser.findByIdAndUpdate(id, {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: adminId
    });

    return newUser;
  }

  async rejectPendingUser(id: string, adminId: string, remarks?: string): Promise<void> {
    await PendingUser.findByIdAndUpdate(id, {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      remarks: remarks || 'Application rejected'
    });
  }
}

export const dbService = new DatabaseService();