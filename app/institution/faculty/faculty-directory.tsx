"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { AddFacultyModal } from "@/components/institution/add-faculty-modal";
import {
  GraduationCap,
  Search,
  Plus,
  Mail,
  Briefcase,
  Calendar,
  Building2,
  Lock,
  UserCheck,
} from "lucide-react";

export interface FacultyItem {
  id: string;
  full_name: string;
  designation: string | null;
  department: string | null;
  email: string;
  created_at: string;
}

interface FacultyDirectoryProps {
  initialFaculty: FacultyItem[];
  institutionName: string;
  institutionCode: string | null;
}

export function FacultyDirectory({
  initialFaculty,
  institutionName,
  institutionCode,
}: FacultyDirectoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [facultyList, setFacultyList] = React.useState<FacultyItem[]>(initialFaculty);
  const [search, setSearch] = React.useState("");
  const [designationFilter, setDesignationFilter] = React.useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  // Sync state on server refresh
  React.useEffect(() => {
    setFacultyList(initialFaculty);
  }, [initialFaculty]);

  // Auto-open modal if ?action=add is in the query params
  React.useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleCreationSuccess = (created: {
    fullName: string;
    email: string;
    designation: string;
    department: string;
  }) => {
    setActionMessage(
      `Faculty member "${created.fullName}" (${created.designation}, ${created.department}) successfully added with login email: ${created.email}`
    );
    router.refresh();
  };

  const filteredFaculty = facultyList.filter((f) => {
    const query = search.toLowerCase();
    const matchesSearch =
      f.full_name.toLowerCase().includes(query) ||
      (f.email && f.email.toLowerCase().includes(query)) ||
      (f.department && f.department.toLowerCase().includes(query)) ||
      (f.designation && f.designation.toLowerCase().includes(query));

    const desig = f.designation || "Other";
    const matchesDesignation =
      designationFilter === "all" || desig.toLowerCase() === designationFilter.toLowerCase();

    return matchesSearch && matchesDesignation;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Message */}
      {actionMessage && (
        <div className="p-3 rounded-xl border border-ayush-green/30 bg-ayush-green/10 text-ayush-green text-xs font-medium">
          {actionMessage}
        </div>
      )}

      {/* Institution Affiliation Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-ayush-surface-raised border border-ayush-border/70 shadow-warm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-ayush-brown/10 text-ayush-brown">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-ayush-dark">
                {institutionName}
              </span>
              <span title="Strictly scoped to your authenticated institution">
                <Lock className="w-3.5 h-3.5 text-ayush-brown" />
              </span>
            </div>
            <p className="text-xs text-ayush-muted mt-0.5">
              Campus Code: <strong className="text-ayush-dark">{institutionCode || "AYUSH-INST"}</strong> &bull; Only authorized faculty of this campus are shown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="parchment" className="text-xs font-semibold">
            {facultyList.length} Total Faculty
          </Badge>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 text-xs bg-ayush-brown hover:bg-ayush-brown/90 text-white font-semibold gap-1.5 shadow-warm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty</span>
          </Button>
        </div>
      </div>

      {/* Controls Bar: Search & Designation Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-ayush-card p-4 rounded-xl border border-ayush-border/80 shadow-warm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ayush-muted" />
          <Input
            placeholder="Search by name, department, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            "all",
            "Professor",
            "Associate Professor",
            "Assistant Professor",
            "HOD",
            "Dean",
            "Principal",
            "Lecturer",
          ].map((des) => (
            <button
              key={des}
              onClick={() => setDesignationFilter(des)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                designationFilter.toLowerCase() === des.toLowerCase()
                  ? "bg-ayush-brown text-ayush-card shadow-warm"
                  : "bg-ayush-sand/50 text-ayush-dark hover:bg-ayush-sand"
              }`}
            >
              {des}
            </button>
          ))}
        </div>
      </div>

      {/* Faculty Directory Table */}
      <div className="rounded-xl border border-ayush-border/80 bg-ayush-card shadow-warm overflow-hidden">
        {filteredFaculty.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={GraduationCap}
              title="No Faculty Members Found"
              description={
                search || designationFilter !== "all"
                  ? "No faculty members match your current filter criteria."
                  : "No faculty accounts have been provisioned for this campus yet. Click '+ Add Faculty' to onboard mentors."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ayush-border/80 bg-ayush-sand/40 text-ayush-dark font-heading uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Faculty Name</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Added Date</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ayush-border/60 text-ayush-dark">
                {filteredFaculty.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-ayush-sand/20 transition-colors">
                    <td className="p-4 font-medium">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-ayush-sand/60 text-ayush-brown shrink-0 mt-0.5">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-ayush-dark">
                            {faculty.full_name}
                          </div>
                          <div className="text-[11px] text-ayush-muted mt-0.5">
                            ID: {faculty.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-ayush-sand/40 text-ayush-brown border border-ayush-border/50">
                        {faculty.designation || "Faculty Member"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-ayush-dark font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-ayush-muted shrink-0" />
                        <span>{faculty.department || "Academic Department"}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-ayush-muted">
                        <Mail className="w-3.5 h-3.5 text-ayush-muted shrink-0" />
                        <span className="font-mono text-[11px] text-ayush-dark">{faculty.email}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-ayush-muted">
                        <Calendar className="w-3.5 h-3.5 text-ayush-muted shrink-0" />
                        <span>{formatDate(faculty.created_at)}</span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <Badge variant="herbal" className="text-[10px] uppercase">
                        Active
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Faculty Modal */}
      <AddFacultyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        institutionName={institutionName}
        onSuccess={handleCreationSuccess}
      />
    </div>
  );
}
