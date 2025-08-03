import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  course: z.enum(["B.Tech", "MCA", "MBA", "M.Tech", "BCA", "BBA"]),
  year: z.number().min(2020).max(2030),
});

const batchFormSchema = z.object({
  students: z.array(studentSchema).min(1, "At least one student is required"),
  year: z.number().min(2020).max(2030),
});

type BatchFormData = z.infer<typeof batchFormSchema>;
type StudentData = z.infer<typeof studentSchema>;

interface BatchCreationFormProps {
  onClose: () => void;
}

export default function BatchCreationForm({ onClose }: BatchCreationFormProps) {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [bulkImportMode, setBulkImportMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      students: [],
      year: currentYear,
    },
  });

  const studentForm = useForm<StudentData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      enrollmentId: "",
      course: "B.Tech",
      year: currentYear,
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (studentData: StudentData) => {
      // First create user
      const userResponse = await apiRequest("POST", "/api/admin/users", {
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone,
        role: "student",
      });
      const user = await userResponse.json();

      // Then create student record
      const studentResponse = await apiRequest("POST", "/api/admin/students", {
        userId: user.id,
        enrollmentId: studentData.enrollmentId,
        course: studentData.course,
        year: studentData.year,
      });
      return studentResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Students Added",
        description: "Students have been successfully added to the system",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-students"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add students",
        variant: "destructive",
      });
    },
  });

  const addStudent = (studentData: StudentData) => {
    setStudents(prev => [...prev, studentData]);
    studentForm.reset({
      name: "",
      email: "",
      phone: "",
      enrollmentId: "",
      course: "B.Tech",
      year: currentYear,
    });
  };

  const removeStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    for (const student of students) {
      await createStudentMutation.mutateAsync(student);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedStudents: StudentData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length && values[0]) {
          const student: StudentData = {
            name: values[0] || "",
            email: values[1] || "",
            phone: values[2] || "",
            enrollmentId: values[3] || "",
            course: (values[4] as any) || "B.Tech",
            year: parseInt(values[5]) || currentYear,
          };
          
          // Validate student data
          const result = studentSchema.safeParse(student);
          if (result.success) {
            parsedStudents.push(result.data);
          }
        }
      }
      
      setStudents(prev => [...prev, ...parsedStudents]);
      toast({
        title: "CSV Imported",
        description: `Successfully imported ${parsedStudents.length} students`,
      });
    };
    
    reader.readAsText(file);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Students</DialogTitle>
          <DialogDescription>
            Add students individually or import from CSV file. Batches will be created automatically based on the rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={!bulkImportMode ? "default" : "outline"}
              onClick={() => setBulkImportMode(false)}
            >
              Manual Entry
            </Button>
            <Button
              type="button"
              variant={bulkImportMode ? "default" : "outline"}
              onClick={() => setBulkImportMode(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              CSV Import
            </Button>
          </div>

          {bulkImportMode ? (
            /* CSV Import */
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  CSV format: Name, Email, Phone, Enrollment ID, Course, Year
                </p>
              </div>
            </div>
          ) : (
            /* Manual Entry */
            <Form {...studentForm}>
              <form onSubmit={studentForm.handleSubmit(addStudent)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={studentForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@university.edu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studentForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studentForm.control}
                    name="enrollmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment ID</FormLabel>
                        <FormControl>
                          <Input placeholder="CS2024001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studentForm.control}
                    name="course"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="B.Tech">B.Tech</SelectItem>
                            <SelectItem value="MCA">MCA</SelectItem>
                            <SelectItem value="MBA">MBA</SelectItem>
                            <SelectItem value="M.Tech">M.Tech</SelectItem>
                            <SelectItem value="BCA">BCA</SelectItem>
                            <SelectItem value="BBA">BBA</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studentForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2020}
                            max={2030}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student to List
                </Button>
              </form>
            </Form>
          )}

          {/* Students List */}
          {students.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Students to Add ({students.length})</h3>
                <div className="text-sm text-muted-foreground">
                  B.Tech: {students.filter(s => s.course === "B.Tech").length} | 
                  Others: {students.filter(s => s.course !== "B.Tech").length}
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <div className="divide-y">
                  {students.map((student, index) => (
                    <div key={index} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.course} • {student.enrollmentId} • {student.email}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStudent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Batch Preview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Batch Creation Preview</h4>
                <p className="text-sm text-muted-foreground">
                  With {students.length} students, approximately {Math.floor(
                    Math.min(
                      Math.floor(students.filter(s => s.course === "B.Tech").length / 2),
                      Math.floor(students.filter(s => s.course !== "B.Tech").length / 3)
                    )
                  )} batches can be created following the auto-assignment rules.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={students.length === 0 || createStudentMutation.isPending}
            >
              {createStudentMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Adding Students...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add {students.length} Students
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
