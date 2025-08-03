export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "faculty" | "student";
  isActive: boolean;
}

export interface Student {
  userId: string;
  enrollmentId: string;
  course: string;
  year: number;
  batchId?: string;
}

export interface Faculty {
  userId: string;
  designation: string;
  department: string;
}

export interface Batch {
  id: string;
  name: string;
  year: number;
  isActive: boolean;
}

export interface FacultyAssignment {
  id: string;
  facultyId: string;
  batchId: string;
  year: number;
}

export interface ResearchDocument {
  id: string;
  studentId: string;
  batchId: string;
  title: string;
  fileUrl: string;
  remarks?: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
}

export interface Attendance {
  id: string;
  batchId: string;
  weekNumber: number;
  year: number;
  data: Record<string, "present" | "absent">;
  submittedBy: string;
  submittedAt: string;
}

export interface Marks {
  id: string;
  studentId: string;
  batchId: string;
  subject: string;
  weekNumber: number;
  year: number;
  marks: number;
  submittedBy: string;
  submittedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  toType: "all" | "faculty" | "students" | "specific_ids";
  recipientIds?: string[];
  isRead: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AdminStats {
  totalStudents: number;
  totalFaculty: number;
  activeBatches: number;
  pendingAssignments: number;
}

export interface StudentDashboardData {
  student: Student;
  batch?: Batch;
  facultyAssignments: FacultyAssignment[];
  researchDocuments: ResearchDocument[];
  marks: Marks[];
  notifications: Notification[];
}

export interface FacultyDashboardData {
  assignments: Array<Batch & { students: Student[]; assignment: FacultyAssignment }>;
  totalBatches: number;
  totalStudents: number;
}
