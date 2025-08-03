import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layers, Users, Clock, Calendar, CheckCircle, FileText } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceForm from "@/components/attendance-form";
import { useToast } from "@/hooks/use-toast";
import type { FacultyDashboardData } from "@/types";

export default function FacultyDashboard() {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<FacultyDashboardData>({
    queryKey: ["/api/faculty/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No faculty data found</p>
        </div>
      </div>
    );
  }

  const { assignments, totalBatches, totalStudents } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Manage your assigned batches and student progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Batches</p>
                <p className="text-2xl font-bold">{totalBatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold">7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="batches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="batches">My Batches</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="marks">Marks Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-6">
          {/* Assigned Batches */}
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Batches</CardTitle>
              <CardDescription>Overview of all batches under your supervision</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((batch) => (
                    <Card key={batch.id} className="border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{batch.name}</h4>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p><span className="font-medium">Students:</span> {batch.students.length}</p>
                          <p><span className="font-medium">Year:</span> {batch.year}</p>
                          <p><span className="font-medium">Last Updated:</span> 2 days ago</p>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedBatch(batch.id)}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedBatch(batch.id);
                              setShowAttendanceForm(true);
                            }}
                          >
                            Mark Attendance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="mx-auto h-12 w-12 mb-4" />
                  <p>No batches assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Attendance Entry</CardTitle>
                  <CardDescription>Mark attendance for your assigned batches</CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAttendanceForm(true)}
                  disabled={assignments.length === 0}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  New Attendance Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a batch and week to mark attendance. Attendance is recorded weekly, not daily.
                  </p>
                  
                  {/* Recent Attendance Entries */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Entries</h4>
                    <div className="space-y-2">
                      {assignments.slice(0, 3).map((batch) => (
                        <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{batch.name}</p>
                            <p className="text-sm text-muted-foreground">Week 8 • {batch.students.length} students</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Completed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <p>No batches available for attendance marking</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marks Entry</CardTitle>
              <CardDescription>Enter weekly assessment marks for students</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter marks for weekly assessments. Each student can have multiple subjects per week.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((batch) => (
                      <Card key={batch.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{batch.name}</h4>
                            <Badge variant="outline">{batch.students.length} students</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">Year {batch.year}</p>
                          <Button variant="outline" className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            Enter Marks
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No batches available for marks entry</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Form Modal */}
      {showAttendanceForm && selectedBatch && (
        <AttendanceForm 
          batchId={selectedBatch}
          onClose={() => {
            setShowAttendanceForm(false);
            setSelectedBatch(null);
          }}
        />
      )}
    </div>
  );
}
