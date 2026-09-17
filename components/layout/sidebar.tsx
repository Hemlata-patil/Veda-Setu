"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LotusEmblem } from "@/components/ui/motifs";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Briefcase,
  BookOpen,
  Award,
  Users,
  User,
  LogOut,
  X,
  ChevronRight,
  Compass,
  FileCheck2,
  BarChart3,
  Microscope,
  Scroll,
} from "lucide-react";

import { AdminAccessModal } from "@/components/auth/admin-access-modal";
import { useAdminTrigger } from "@/components/auth/use-admin-trigger";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  className?: string;
  userRole?: "student" | "faculty" | "institution" | "industry" | "super_admin";
  userName?: string;
  userEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

function getNavSectionsForRole(role: "student" | "faculty" | "institution" | "industry" | "super_admin"): NavSection[] {
  const dashboardPath = role === "super_admin" ? "/super-admin/dashboard" : `/${role}/dashboard`;

  switch (role) {
    case "super_admin":
      return [
        {
          title: "SUPER ADMIN",
          items: [
            { title: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
            { title: "Institutions", href: "/super-admin/institutions", icon: Building2 },
            { title: "Industries", href: "/super-admin/industries", icon: Briefcase },
            { title: "Users", href: "/super-admin/users", icon: Users },
            { title: "Opportunities", href: "/super-admin/opportunities", icon: FileCheck2 },
            { title: "Platform Analytics", href: "/super-admin/analytics", icon: BarChart3 },
          ],
        },
        {
          title: "ACCOUNT",
          items: [
            { title: "My Profile", href: "/profile", icon: User },
          ],
        },
      ];
    case "faculty":
      return [
        {
          title: "Mentorship & Academic",
          items: [
            { title: "Faculty Dashboard", href: dashboardPath, icon: LayoutDashboard },
            { title: "My Students", href: "/faculty/students", icon: Users },
            { title: "Mentorship", href: "/faculty/mentorship", icon: GraduationCap },
            { title: "FDP & Research", href: "/faculty/collaboration", icon: Microscope },
          ],
        },
        {
          title: "Account",
          items: [
            { title: "My Profile", href: "/profile", icon: User },
          ],
        },
      ];
    case "institution":
      return [
        {
          title: "Institutional Management",
          items: [
            { title: "Institution Dashboard", href: dashboardPath, icon: LayoutDashboard },
            { title: "Students", href: "/institution/students", icon: Users },
            { title: "Faculty", href: "/institution/faculty", icon: GraduationCap },
            { title: "Analytics", href: "/institution/analytics", icon: BarChart3 },
            { title: "Internship & Placement", href: "/institution/internship-placement", icon: Award },
          ],
        },
        {
          title: "Account",
          items: [
            { title: "My Profile", href: "/profile", icon: User },
          ],
        },
      ];
    case "industry":
      return [
        {
          title: "Industry & Projects",
          items: [
            { title: "Industry Dashboard", href: dashboardPath, icon: LayoutDashboard },
            { title: "Opportunities", href: "/industry/opportunities", icon: Briefcase },
            { title: "Applications / Candidates", href: "/industry/applications", icon: Users },
            { title: "Internship & Placement", href: "/industry/internship-placement", icon: Award },
          ],
        },
        {
          title: "Account",
          items: [
            { title: "My Profile", href: "/profile", icon: User },
          ],
        },
      ];
    case "student":
    default:
      return [
        {
          title: "Academic & Training",
          items: [
            { title: "Student Dashboard", href: dashboardPath, icon: LayoutDashboard },
            { title: "Skills & Assessment", href: "/student/assessment", icon: BookOpen },
            { title: "Skill Profile", href: "/student/skill-profile", icon: Award },
            { title: "Learning & Roadmap", href: "/student/learning", icon: Compass },
            { title: "Opportunities", href: "/student/opportunities", icon: Briefcase },
            { title: "My Applications", href: "/student/applications", icon: FileCheck2 },
            { title: "Internship & Placement", href: "/student/internship-placement", icon: Award },
            { title: "My Portfolio", href: "/student/portfolio", icon: Scroll },
            { title: "My Mentorship", href: "/student/mentorship", icon: GraduationCap },
          ],
        },
        {
          title: "Account",
          items: [
            { title: "My Profile", href: "/profile", icon: User },
          ],
        },
      ];
  }
}

export function Sidebar({
  className,
  userRole = "student",
  userName = "Ayush Scholar",
  userEmail = "scholar@ayush.gov.in",
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const { isAdminModalOpen, closeAdminModal, handleLogoClick } = useAdminTrigger();

  const navSections = getNavSectionsForRole(userRole);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network/session closed errors during logout
    }
    router.push("/auth/login");
    router.refresh();
  };

  const portalLabel = {
    student: "Student Portal",
    faculty: "Faculty Portal",
    institution: "Institution Portal",
    industry: "Industry Portal",
    super_admin: "Super Admin Portal",
  }[userRole] || `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal`;

  return (
    <>
      {/* Hidden 5-Click Admin Access Modal */}
      <AdminAccessModal
        isOpen={isAdminModalOpen}
        onClose={closeAdminModal}
      />

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ayush-dark/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ayush-border/80 bg-ayush-card text-ayush-dark transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className,
        )}
      >
        {/* Brand Header with Hidden 5-click Trigger */}
        <div className="flex h-16 items-center justify-between border-b border-ayush-border/60 px-5">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center group select-none py-1 focus:outline-none"
            title="VEDA SETU"
            aria-label="Veda Setu"
          >
            <Image
              src="/images/veda-setu-logo.png"
              alt="Veda Setu"
              width={180}
              height={60}
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-ayush-muted hover:bg-ayush-sand/50 hover:text-ayush-dark lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Badge Banner */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-lg border border-ayush-border/70 bg-ayush-sand/40 p-2.5">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", userRole === "super_admin" ? "bg-ayush-saffron animate-pulse" : "bg-ayush-green")} />
              <span className="text-xs font-semibold text-ayush-dark">
                {portalLabel}
              </span>
            </div>
            <Badge
              variant={
                userRole === "student"
                  ? "herbal"
                  : userRole === "faculty"
                  ? "saffron"
                  : userRole === "super_admin"
                  ? "default"
                  : "default"
              }
              className={cn("text-[10px] py-0 px-2 uppercase", userRole === "super_admin" && "bg-ayush-brown text-ayush-saffron border border-ayush-saffron/30")}
            >
              {userRole === "super_admin" ? "Super Admin" : userRole}
            </Badge>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-3">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ayush-muted">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "#" && item.href !== "/" && pathname?.startsWith(`${item.href}/`));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href + item.title}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-ayush-brown text-ayush-card shadow-warm"
                          : "text-ayush-dark hover:bg-ayush-sand/60 hover:text-ayush-brown",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive
                              ? "text-ayush-saffron"
                              : "text-ayush-muted group-hover:text-ayush-brown",
                          )}
                        />
                        <span>{item.title}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-ayush-sand text-ayush-brown",
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100",
                            isActive && "opacity-100 text-ayush-saffron",
                          )}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="border-t border-ayush-border/70 p-4 bg-ayush-card space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ayush-sand text-ayush-brown font-semibold text-xs border border-ayush-border shrink-0">
                {(userName || "AU").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold text-ayush-dark">
                  {userName || "Ayush User"}
                </span>
                <span className="truncate text-[11px] text-ayush-muted">
                  {userEmail}
                </span>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              title="Sign Out"
              className="p-2 rounded-lg text-ayush-muted hover:text-ayush-terracotta hover:bg-ayush-terracotta/10 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
