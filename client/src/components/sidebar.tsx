import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Layers,
  Bell,
  FileSpreadsheet,
  Home,
  FileText,
  BarChart3,
  Calendar,
  Star,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Student Management", icon: Users, href: "/admin/students" },
  { label: "Faculty Management", icon: UserCheck, href: "/admin/faculty" },
  { label: "Batch Management", icon: Layers, href: "/admin/batches" },
  { label: "Notices", icon: Bell, href: "/admin/notices" },
  { label: "Bulk Import", icon: FileSpreadsheet, href: "/admin/import" },
];

const studentNavItems = [
  { label: "Dashboard", icon: Home, href: "/student" },
  { label: "My Batch", icon: Users, href: "/student/batch" },
  { label: "Research Documents", icon: FileText, href: "/student/documents" },
  { label: "Attendance & Marks", icon: BarChart3, href: "/student/progress" },
];

const facultyNavItems = [
  { label: "Dashboard", icon: Home, href: "/faculty" },
  { label: "My Batches", icon: Users, href: "/faculty/batches" },
  { label: "Attendance", icon: Calendar, href: "/faculty/attendance" },
  { label: "Mark Assessment", icon: Star, href: "/faculty/marks" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  let navItems: Array<{label: string, icon: any, href: string}> = [];
  let sectionTitle = "";

  switch (user.role) {
    case "admin":
      navItems = adminNavItems;
      sectionTitle = "Administration";
      break;
    case "student":
      navItems = studentNavItems;
      sectionTitle = "Student";
      break;
    case "faculty":
      navItems = facultyNavItems;
      sectionTitle = "Faculty";
      break;
    default:
      navItems = [];
  }

  const handleNavigation = (href: string) => {
    setLocation(href);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col flex-shrink-0 w-64 h-full pt-16 font-normal duration-300 transition-transform bg-white border-r border-gray-200 lg:flex lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="lg:hidden absolute top-4 right-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-5">
          <div className="space-y-1">
            {/* Section Title */}
            <div className="px-3 py-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {sectionTitle}
              </h2>
            </div>

            {/* Navigation Items */}
            {navItems.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary-light/20 text-primary hover:bg-primary-light/30"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
