import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { GraduationCap, ArrowLeft, UserPlus, BookOpen, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits"),
  role: z.enum(["student", "faculty"], { required_error: "Please select a role" }),
  
  // Student specific fields
  enrollmentId: z.string().optional(),
  course: z.enum(["B.Tech", "M.Tech", "MBA", "MCA", "PhD"], { required_error: "Please select a course" }).optional(),
  year: z.number().int().min(2024).max(2030).optional(),
  
  // Faculty specific fields
  designation: z.string().optional(),
  department: z.string().optional(),
}).refine((data) => {
  if (data.role === "student") {
    return data.enrollmentId && data.course && data.year;
  }
  if (data.role === "faculty") {
    return data.designation && data.department;
  }
  return true;
}, {
  message: "All role-specific fields are required",
  path: ["role"]
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function Registration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"student" | "faculty" | null>(null);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: undefined,
      enrollmentId: "",
      course: undefined,
      year: new Date().getFullYear(),
      designation: "",
      department: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        appliedAt: new Date(),
        status: "pending"
      });
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your registration has been submitted successfully. Admin will review and approve your application.",
      });
      setLocation("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    registerMutation.mutate(data);
  };

  const handleRoleChange = (role: "student" | "faculty") => {
    setSelectedRole(role);
    form.setValue("role", role);
    
    // Clear role-specific fields when changing role
    if (role === "student") {
      form.setValue("designation", "");
      form.setValue("department", "");
    } else {
      form.setValue("enrollmentId", "");
      form.setValue("course", undefined);
      form.setValue("year", undefined);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">AcademiX</h1>
                <p className="text-sm text-gray-500">Academic Management System</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/login")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8 min-h-0">
        <Card className="w-full max-w-3xl mx-auto shadow-xl border-0 my-4">
          <CardHeader className="space-y-1 bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">
              Join AcademiX
            </CardTitle>
            <CardDescription className="text-center text-purple-100">
              Register as a new student or faculty member
            </CardDescription>
          </CardHeader>
        
          <CardContent className="space-y-6 p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Select Your Role</h3>
                    <p className="text-sm text-gray-600">Choose the role that best describes you</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={selectedRole === "student" ? "default" : "outline"}
                      size="lg"
                      className="h-20 sm:h-24 flex flex-col gap-2 border-2 transition-all duration-200"
                      onClick={() => handleRoleChange("student")}
                    >
                      <BookOpen className="h-6 w-6" />
                      <span className="font-semibold text-base">Student</span>
                      <span className="text-xs opacity-75">Academic Programs</span>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={selectedRole === "faculty" ? "default" : "outline"}
                      size="lg"
                      className="h-20 sm:h-24 flex flex-col gap-2 border-2 transition-all duration-200"
                      onClick={() => handleRoleChange("faculty")}
                    >
                      <Users className="h-6 w-6" />
                      <span className="font-semibold text-base">Faculty</span>
                      <span className="text-xs opacity-75">Teaching Staff</span>
                    </Button>
                  </div>
                </div>

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@university.edu"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+91 9876543210"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Student Specific Fields */}
                {selectedRole === "student" && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900">Student Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="enrollmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enrollment ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="2024CS001"
                                {...field}
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
                                min="2024"
                                max="2030"
                                placeholder="2024"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="B.Tech">B.Tech</SelectItem>
                              <SelectItem value="M.Tech">M.Tech</SelectItem>
                              <SelectItem value="MBA">MBA</SelectItem>
                              <SelectItem value="MCA">MCA</SelectItem>
                              <SelectItem value="PhD">PhD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Faculty Specific Fields */}
                {selectedRole === "faculty" && (
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900">Faculty Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="designation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Assistant Professor"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Computer Science"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base"
                  disabled={registerMutation.isPending || !selectedRole}
                >
                  {registerMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting Application...
                    </div>
                  ) : (
                    "Submit Application for Review"
                  )}
                </Button>

                <p className="text-sm text-gray-600 text-center">
                  By submitting this application, you agree to the terms and conditions. 
                  Your application will be reviewed by an administrator.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}