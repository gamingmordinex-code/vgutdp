import { dbService } from "./database";

export async function createBatchesFromPendingStudents(year: number) {
  const pendingStudents = await dbService.getUnassignedStudents(year);
  
  // Group students by course
  const btechStudents = pendingStudents.filter(s => s.course === "B.Tech");
  const otherStudents = pendingStudents.filter(s => s.course !== "B.Tech");
  
  const createdBatches = [];
  let batchNumber = 1;
  
  // Create batches while we have enough students
  while (btechStudents.length >= 2 && otherStudents.length >= 3) {
    // Create new batch
    const batchName = `BT-${year}-${String(batchNumber).padStart(2, '0')}`;
    const batch = await dbService.createBatch({
      name: batchName,
      year: year,
      isActive: true
    });
    
    // Assign 2 B.Tech students and 3 others
    const selectedBtech = btechStudents.splice(0, 2);
    const selectedOthers = otherStudents.splice(0, 3);
    const allSelected = [...selectedBtech, ...selectedOthers];
    
    // Update students with batch assignment
    for (const student of allSelected) {
      await dbService.updateStudent(student.userId.toString(), { batchId: batch.id });
    }
    
    // Auto-assign faculty (max 2 batches per faculty per year)
    await autoAssignFaculty(batch.id, year);
    
    createdBatches.push({
      ...batch.toObject(),
      studentCount: allSelected.length,
      students: allSelected
    });
    
    batchNumber++;
  }
  
  return createdBatches;
}

async function autoAssignFaculty(batchId: string, year: number) {
  // Get faculty with their current assignment counts for this year
  const facultyWithAssignments = await dbService.getFacultyWithAssignments(year);
  
  // Find faculty with less than 2 assignments
  const availableFaculty = facultyWithAssignments.filter(f => f.assignmentCount < 2);
  
  if (availableFaculty.length > 0) {
    // Assign to faculty with least assignments
    const selectedFaculty = availableFaculty.sort((a, b) => a.assignmentCount - b.assignmentCount)[0];
    
    await dbService.createFacultyAssignment({
      facultyId: selectedFaculty.userId.toString(),
      batchId: batchId,
      year: year
    });
  }
}