import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X, Save, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Student } from "@/types";

const attendanceSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  weekNumber: z.number().min(1).max(52),
  year: z.number().min(2020).max(2030),
  attendance: z.record(z.enum(["present", "absent"])),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface AttendanceFormProps {
  batchId: string;
  onClose: () => void;
}

export default function AttendanceForm({ batchId, onClose }: AttendanceFormProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, "present" | "absent">>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      batchId,
      weekNumber: 1,
      year: currentYear,
      attendance: {},
    },
  });

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/faculty/batch", batchId, "students"],
  });

  const submitAttendanceMutation = useMutation({
    mutationFn: (data: AttendanceFormData) => 
      apiRequest("POST", "/api/faculty/attendance", {
        batchId: data.batchId,
        weekNumber: data.weekNumber,
        year: data.year,
        data: data.attendance,
      }),
    onSuccess: () => {
      toast({
        title: "Attendance Saved",
        description: "Weekly attendance has been successfully recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/faculty/dashboard"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      });
    },
  });

  const handleAttendanceChange = (studentId: string, status: "present" | "absent") => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAllPresent = () => {
    if (!students) return;
    const allPresent = students.reduce((acc, student) => ({
      ...acc,
      [student.userId]: "present" as const,
    }), {});
    setAttendanceData(allPresent);
  };

  const markAllAbsent = () => {
    if (!students) return;
    const allAbsent = students.reduce((acc, student) => ({
      ...acc,
      [student.userId]: "absent" as const,
    }), {});
    setAttendanceData(allAbsent);
  };

  const onSubmit = (data: AttendanceFormData) => {
    const formData = {
      ...data,
      attendance: attendanceData,
    };
    submitAttendanceMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Weekly Attendance Entry</DialogTitle>
          <DialogDescription>
            Mark attendance for all students in this batch for the specified week.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Week and Year Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weekNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
                Mark All Present
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={markAllAbsent}>
                Mark All Absent
              </Button>
            </div>

            {/* Student Attendance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Student Attendance</h3>
                <div className="text-sm text-muted-foreground">
                  {students?.length || 0} students
                </div>
              </div>

              {students && students.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {students.map((student) => (
                    <div key={student.userId} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {student.enrollmentId.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Student</p>
                          <p className="text-sm text-muted-foreground">
                            {student.enrollmentId} • {student.course}
                          </p>
                        </div>
                      </div>
                      
                      <RadioGroup
                        value={attendanceData[student.userId] || ""}
                        onValueChange={(value: "present" | "absent") => 
                          handleAttendanceChange(student.userId, value)
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="present" id={`${student.userId}-present`} />
                          <Label 
                            htmlFor={`${student.userId}-present`}
                            className="text-sm text-green-600 cursor-pointer"
                          >
                            Present
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="absent" id={`${student.userId}-absent`} />
                          <Label 
                            htmlFor={`${student.userId}-absent`}
                            className="text-sm text-red-600 cursor-pointer"
                          >
                            Absent
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p>No students found in this batch</p>
                </div>
              )}
            </div>

            {/* Summary */}
            {students && students.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Attendance Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Students:</span> {students.length}
                  </div>
                  <div>
                    <span className="font-medium text-green-600">Present:</span>{" "}
                    {Object.values(attendanceData).filter(status => status === "present").length}
                  </div>
                  <div>
                    <span className="font-medium text-red-600">Absent:</span>{" "}
                    {Object.values(attendanceData).filter(status => status === "absent").length}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitAttendanceMutation.isPending ||
                  !students ||
                  students.length === 0 ||
                  Object.keys(attendanceData).length !== students.length
                }
              >
                {submitAttendanceMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Weekly Attendance
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
