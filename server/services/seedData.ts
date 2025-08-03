import { User } from '../models/User';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { Batch } from '../models/Batch';
import { FacultyAssignment } from '../models/FacultyAssignment';

export async function seedDatabase() {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database with initial data...');

    // Create Admin User
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@college.edu',
      phone: '+919414966535',
      role: 'admin',
      isActive: true
    });

    // Create Faculty Users
    const facultyUsers = await User.insertMany([
      {
        name: 'Prof. Rajesh Sharma',
        email: 'sharma@college.edu',
        phone: '+919414966536',
        role: 'faculty',
        isActive: true
      },
      {
        name: 'Prof. Priya Gupta',
        email: 'gupta@college.edu',
        phone: '+919414966537',
        role: 'faculty',
        isActive: true
      },
      {
        name: 'Prof. Vikram Singh',
        email: 'singh@college.edu',
        phone: '+919414966538',
        role: 'faculty',
        isActive: true
      }
    ]);

    // Create Faculty Records
    const facultyRecords = await Faculty.insertMany([
      {
        userId: facultyUsers[0]._id,
        designation: 'Assistant Professor',
        department: 'Computer Science'
      },
      {
        userId: facultyUsers[1]._id,
        designation: 'Associate Professor',
        department: 'Information Technology'
      },
      {
        userId: facultyUsers[2]._id,
        designation: 'Professor',
        department: 'Electronics'
      }
    ]);

    // Create Student Users
    const studentUsers = await User.insertMany([
      {
        name: 'Rahul Kumar',
        email: 'rahul@college.edu',
        phone: '+919414966539',
        role: 'student',
        isActive: true
      },
      {
        name: 'Priya Sharma',
        email: 'priya.s@college.edu',
        phone: '+919414966540',
        role: 'student',
        isActive: true
      },
      {
        name: 'Amit Verma',
        email: 'amit@college.edu',
        phone: '+919414966541',
        role: 'student',
        isActive: true
      },
      {
        name: 'Sneha Patel',
        email: 'sneha@college.edu',
        phone: '+919414966542',
        role: 'student',
        isActive: true
      },
      {
        name: 'Rohit Gupta',
        email: 'rohit@college.edu',
        phone: '+919414966543',
        role: 'student',
        isActive: true
      }
    ]);

    // Create Sample Batches
    const batches = await Batch.insertMany([
      {
        name: 'CS-2025-A',
        year: 2025,
        isActive: true
      },
      {
        name: 'IT-2025-B',
        year: 2025,
        isActive: true
      }
    ]);

    // Create Student Records
    await Student.insertMany([
      {
        userId: studentUsers[0]._id,
        enrollmentId: 'CS2025001',
        course: 'B.Tech',
        year: 2025,
        batchId: batches[0]._id
      },
      {
        userId: studentUsers[1]._id,
        enrollmentId: 'CS2025002',
        course: 'MCA',
        year: 2025,
        batchId: batches[0]._id
      },
      {
        userId: studentUsers[2]._id,
        enrollmentId: 'IT2025001',
        course: 'B.Tech',
        year: 2025,
        batchId: batches[1]._id
      },
      {
        userId: studentUsers[3]._id,
        enrollmentId: 'IT2025002',
        course: 'MBA',
        year: 2025,
        batchId: batches[1]._id
      },
      {
        userId: studentUsers[4]._id,
        enrollmentId: 'CS2025003',
        course: 'BCA',
        year: 2025,
        batchId: null // Unassigned for testing
      }
    ]);

    // Create Faculty Assignments
    await FacultyAssignment.insertMany([
      {
        facultyId: facultyUsers[0]._id,
        batchId: batches[0]._id,
        year: 2025
      },
      {
        facultyId: facultyUsers[1]._id,
        batchId: batches[1]._id,
        year: 2025
      }
    ]);

    console.log('✅ Database seeded successfully');
    console.log('📧 Admin: admin@college.edu | Phone: +919414966535');
    console.log('🔑 Fixed OTP for all users: 263457');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}