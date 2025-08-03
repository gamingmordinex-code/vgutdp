import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, UserCheck, Layers, Clock, Bell, FileSpreadsheet, UserPlus, Send, CheckCircle, XCircle, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BatchCreationForm from "@/components/batch-creation-form";
import { useState } from "react";
import type { AdminStats } from "@/types";

interface PendingStudent {
  userId: string;
  enrollmentId: string;
  course: string;
  year: number;
  user: {
    name: string;
    email: string;
  };
}

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: string;
}

export default function AdminDashboard() {
  const [showBatchForm, setShowBatchForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingStudents, isLoading: pendingLoading } = useQuery<PendingStudent[]>({
    queryKey: ["/api/admin/pending-students", currentYear],
  });

  const { data: pendingUsers, isLoading: pendingUsersLoading } = useQuery({
    queryKey: ["/api/admin/pending-users"],
  });

  const createBatchesMutation = useMutation({
    mutationFn: (year: number) => apiRequest("POST", "/api/admin/batches/create", { year }),
    onSuccess: (data) => {
      toast({
        title: "Batches Created",
        description: `Successfully created ${data.batches.length} new batches`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-students"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create batches",
        variant: "destructive",
      });
    },
  });

  const approvePendingUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/pending-users/${userId}/approve`, {}),
    onSuccess: () => {
      toast({
        title: "User Approved",
        description: "User has been approved and added to the system",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    },
  });

  const rejectPendingUserMutation = useMutation({
    mutationFn: ({ userId, remarks }: { userId: string; remarks?: string }) => 
      apiRequest("POST", `/api/admin/pending-users/${userId}/reject`, { remarks }),
    onSuccess: () => {
      toast({
        title: "User Rejected",
        description: "User application has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive",
      });
    },
  });

  const quickActions = [
    {
      title: "Add New Students",
      description: "Register new students to the system",
      icon: UserPlus,
      action: () => setShowBatchForm(true),
    },
    {
      title: "Create New Batch",
      description: "Auto-create batches from pending students",
      icon: Layers,
      action: () => createBatchesMutation.mutate(currentYear),
    },
    {
      title: "Send Notice",
      description: "Send notifications to users",
      icon: Bell,
      action: () => {},
    },
    {
      title: "Import from Excel",
      description: "Bulk import students from spreadsheet",
      icon: FileSpreadsheet,
      action: () => {},
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: "1",
      description: "25 new students added to B.Tech 2024 batch",
      timestamp: "2 hours ago",
      type: "user-plus",
    },
    {
      id: "2",
      description: "Batch BT-2024-05 assigned to Dr. Smith",
      timestamp: "5 hours ago",
      type: "check",
    },
    {
      id: "3",
      description: "Notice sent: Assignment deadline extended",
      timestamp: "1 day ago",
      type: "bell",
    },
  ];

  if (statsLoading || pendingLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
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
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faculty Members</p>
                <p className="text-2xl font-bold">{stats?.totalFaculty || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Batches</p>
                <p className="text-2xl font-bold">{stats?.activeBatches || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Pending Assignments</p>
                <p className="text-2xl font-bold">{stats?.pendingAssignments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={action.action}
                disabled={action.title === "Create New Batch" && createBatchesMutation.isPending}
              >
                <action.icon className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Pending User Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Pending Applications
              {pendingUsers?.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingUsers.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and approve new user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsersLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading applications...</p>
              </div>
            ) : pendingUsers?.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.slice(0, 3).map((user: any) => (
                  <div key={user.id} className="flex items-start space-x-3 p-4 rounded-lg border">
                    <Avatar>
                      <AvatarFallback>
                        {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <Badge variant={user.role === 'student' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      {user.role === 'student' && (
                        <p className="text-xs text-gray-400">
                          {user.course} • {user.enrollmentId} • Year {user.year}
                        </p>
                      )}
                      {user.role === 'faculty' && (
                        <p className="text-xs text-gray-400">
                          {user.designation} • {user.department}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Applied: {new Date(user.appliedAt).toLocaleDateString()}
                      </p>
                      
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          className="h-7 px-3"
                          onClick={() => approvePendingUserMutation.mutate(user.id)}
                          disabled={approvePendingUserMutation.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-3"
                          onClick={() => rejectPendingUserMutation.mutate({ 
                            userId: user.id, 
                            remarks: "Application rejected by admin" 
                          })}
                          disabled={rejectPendingUserMutation.isPending}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingUsers.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View All ({pendingUsers.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pending applications</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="p-1 bg-primary/10 rounded-full">
                  {activity.type === "user-plus" && <UserPlus className="h-4 w-4 text-primary" />}
                  {activity.type === "check" && <UserCheck className="h-4 w-4 text-green-600" />}
                  {activity.type === "bell" && <Bell className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Batch Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Batch Management</CardTitle>
              <CardDescription>Auto-assignment and batch creation</CardDescription>
            </div>
            <Button onClick={() => createBatchesMutation.mutate(currentYear)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Batch Creation Rules */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-3">Auto-Assignment Rules</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary" />
                <span>5 students per batch</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <span>2 B.Tech students (min-max)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>3 from other courses</span>
              </div>
            </div>
          </div>

          {/* Pending Students */}
          {pendingStudents && pendingStudents.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-yellow-50 border-b px-4 py-3">
                <h4 className="font-medium text-yellow-800">
                  Pending Assignment ({pendingStudents.length} students)
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="divide-y">
                  {pendingStudents.map((student) => (
                    <div key={student.userId} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {student.user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.user.name}</p>
                          <p className="text-sm text-muted-foreground">{student.user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.course}</p>
                        <p className="text-sm text-muted-foreground">{student.year}</p>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(!pendingStudents || pendingStudents.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <p>No pending student assignments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Creation Form Modal */}
      {showBatchForm && (
        <BatchCreationForm onClose={() => setShowBatchForm(false)} />
      )}
    </div>
  );
}
