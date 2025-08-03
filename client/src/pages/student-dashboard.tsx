import { useQuery } from "@tanstack/react-query";
import { Calendar, Star, FileText, Users, Upload } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DocumentUpload from "@/components/document-upload";
import { useState } from "react";
import type { StudentDashboardData } from "@/types";

export default function StudentDashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ["/api/students/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
          <p className="text-muted-foreground">No student data found</p>
        </div>
      </div>
    );
  }

  const { student, batch, facultyAssignments, researchDocuments, marks, notifications } = data;

  // Calculate attendance percentage
  const totalWeeks = 12; // Assuming 12 weeks per semester
  const attendancePercentage = 85; // This would be calculated from actual attendance data

  // Calculate average marks
  const averageMarks = marks.length > 0 
    ? Math.round(marks.reduce((sum, mark) => sum + mark.marks, 0) / marks.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back!</p>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback className="text-lg">
                {student.enrollmentId.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">Student Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                <p><span className="font-medium">Enrollment:</span> {student.enrollmentId}</p>
                <p><span className="font-medium">Course:</span> {student.course}</p>
                <p><span className="font-medium">Year:</span> {student.year}</p>
                <p><span className="font-medium">Batch:</span> {batch?.name || "Not Assigned"}</p>
              </div>
            </div>
            <div>
              <Badge variant={batch ? "default" : "secondary"}>
                {batch ? "Active" : "Pending Assignment"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{attendancePercentage}%</p>
                <Progress value={attendancePercentage} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Marks</p>
                <p className="text-2xl font-bold">{averageMarks}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on {marks.length} assessments
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{researchDocuments.length}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  Research papers uploaded
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Assigned Faculty</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facultyAssignments.length > 0 ? (
              <div className="space-y-4">
                {facultyAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=50&h=50&fit=crop&crop=face" />
                      <AvatarFallback>FA</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">Faculty Member</h4>
                      <p className="text-sm text-muted-foreground">Department Faculty</p>
                      <p className="text-xs text-muted-foreground">faculty@university.edu</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p>No faculty assigned yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Marks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Recent Marks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marks.length > 0 ? (
              <div className="space-y-3">
                {marks.slice(0, 5).map((mark) => (
                  <div key={mark.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{mark.subject}</p>
                      <p className="text-sm text-muted-foreground">Week {mark.weekNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{mark.marks}/100</p>
                      <Badge 
                        variant={mark.marks >= 80 ? "default" : mark.marks >= 60 ? "secondary" : "destructive"}
                      >
                        {mark.marks >= 80 ? "Excellent" : mark.marks >= 60 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="mx-auto h-12 w-12 mb-4" />
                <p>No marks recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Research Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Research Documents</span>
              </CardTitle>
              <CardDescription>Upload and manage your research papers</CardDescription>
            </div>
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {researchDocuments.length > 0 ? (
            <div className="space-y-3">
              {researchDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      {doc.remarks && (
                        <p className="text-xs text-muted-foreground mt-1">{doc.remarks}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        doc.status === "approved" ? "default" : 
                        doc.status === "rejected" ? "destructive" : 
                        "secondary"
                      }
                    >
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p className="mb-2">No documents uploaded yet</p>
              <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                Upload Your First Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUpload onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}
