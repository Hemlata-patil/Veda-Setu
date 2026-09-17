"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

interface DashboardShellProps {
  children: React.ReactNode;
  userRole?: "student" | "faculty" | "institution" | "industry" | "super_admin";
  userName?: string;
  userEmail?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardShell({
  children,
  userRole = "student",
  userName = "Ayush Scholar",
  userEmail = "scholar@ayush.gov.in",
  breadcrumbs,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-transparent text-ayush-dark">
      {/* Sidebar for Desktop & Mobile */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={breadcrumbs}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
