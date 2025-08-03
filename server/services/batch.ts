import { storage } from "../storage";
import type { Student } from "@shared/schema";

export async function createBatchesFromPendingStudents(year: number) {
  const pendingStudents = await storage.getUnassignedStudents(year);
  
  // Group students by course
  const btechStudents = pendingStudents.filter(s => s.course === "B.Tech");
  const otherStudents = pendingStudents.filter(s => s.course !== "B.Tech");
  
  const createdBatches = [];
  let batchNumber = 1;
  
  // Create batches while we have enough students
  while (btechStudents.length >= 2 && otherStudents.length >= 3) {
    // Create new batch
    const batchName = `BT-${year}-${String(batchNumber).padStart(2, '0')}`;
    const batch = await storage.createBatch({
      name: batchName,
      year: year
    });
    
    // Assign 2 B.Tech students and 3 others
    const selectedBtech = btechStudents.splice(0, 2);
    const selectedOthers = otherStudents.splice(0, 3);
    const allSelected = [...selectedBtech, ...selectedOthers];
    
    // Update students with batch assignment
    for (const student of allSelected) {
      await storage.updateStudent(student.userId, { batchId: batch.id });
    }
    
    // Auto-assign faculty (max 2 batches per faculty per year)
    await autoAssignFaculty(batch.id, year);
    
    createdBatches.push({
      ...batch,
      studentCount: allSelected.length,
      students: allSelected
    });
    
    batchNumber++;
  }
  
  return createdBatches;
}

async function autoAssignFaculty(batchId: string, year: number) {
  // Get faculty with their current assignment counts for this year
  const facultyWithAssignments = await storage.getFacultyWithAssignments(year);
  
  // Find faculty with less than 2 assignments
  const availableFaculty = facultyWithAssignments.filter(f => f.assignmentCount < 2);
  
  if (availableFaculty.length > 0) {
    // Assign to faculty with least assignments
    const selectedFaculty = availableFaculty.sort((a, b) => a.assignmentCount - b.assignmentCount)[0];
    
    await storage.createFacultyAssignment({
      facultyId: selectedFaculty.userId,
      batchId: batchId,
      year: year
    });
  }
}

export async function getAvailableFacultyForYear(year: number) {
  return await storage.getFacultyWithAssignments(year);
}

export async function assignFacultyToBatch(facultyId: string, batchId: string, year: number) {
  // Check if faculty already has max assignments
  const currentAssignments = await storage.getFacultyAssignments(facultyId, year);
  if (currentAssignments.length >= 3) {
    throw new Error("Faculty already has maximum assignments for this year");
  }
  
  // Check if batch already has this faculty assigned
  const batchAssignments = await storage.getBatchAssignments(batchId);
  if (batchAssignments.some(a => a.facultyId === facultyId)) {
    throw new Error("Faculty already assigned to this batch");
  }
  
  return await storage.createFacultyAssignment({
    facultyId,
    batchId,
    year
  });
}
