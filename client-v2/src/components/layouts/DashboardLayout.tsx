import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        {/* Sidebar Component */}
        <AppSidebar />
        
        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Navbar Header */}
          <Navbar />
          
          {/* Main Dynamic View Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
