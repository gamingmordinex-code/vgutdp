import { useState } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import Footer from "./footer";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="ml-0 lg:ml-64 pt-16 flex-1">
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1 p-6">
            {children}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
