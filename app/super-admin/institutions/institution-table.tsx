"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateInstitutionStatus, VerificationStatus } from "@/app/super-admin/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { AddInstitutionModal } from "@/components/admin/add-institution-modal";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  GraduationCap,
  MapPin,
  Loader2,
  Plus,
} from "lucide-react";

export interface InstitutionRow {
  id: string;
  name: string;
  code: string | null;
  category?: string | null;
  location?: string | null;
  verification_status?: string | null;
  studentCount: number;
  facultyCount: number;
  created_at: string;
}

export function InstitutionTable({ initialInstitutions }: { initialInstitutions: InstitutionRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [institutions, setInstitutions] = React.useState(initialInstitutions);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Sync state with server revalidations
  React.useEffect(() => {
    setInstitutions(initialInstitutions);
  }, [initialInstitutions]);

  // Auto-open modal if navigated with ?action=add
  React.useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleCreationSuccess = (created: { institutionName: string; adminEmail: string }) => {
    setActionMessage({
      text: `Institution "${created.institutionName}" successfully created. Administrator login account provisioned: ${created.adminEmail}`,
      type: "success",
    });
    router.refresh();
  };

  const filtered = institutions.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      (inst.code && inst.code.toLowerCase().includes(search.toLowerCase())) ||
      (inst.location && inst.location.toLowerCase().includes(search.toLowerCase()));

    const status = inst.verification_status || "approved";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (institutionId: string, newStatus: VerificationStatus) => {
    setLoadingId(institutionId);
    setActionMessage(null);

    try {
      await updateInstitutionStatus(institutionId, newStatus);
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === institutionId ? { ...inst, verification_status: newStatus } : inst
        )
      );
      setActionMessage({
        text: `Institution verification status updated to ${newStatus}.`,
        type: "success",
      });
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Failed to update institution status.",
        type: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const s = status || "approved";
    switch (s) {
      case "approved":
        return <Badge variant="herbal" className="text-[10px] uppercase">Approved</Badge>;
      case "pending":
        return <Badge variant="saffron" className="text-[10px] uppercase">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive" className="text-[10px] uppercase">Suspended</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px] uppercase">Rejected</Badge>;
      default:
        return <Badge variant="default" className="text-[10px] uppercase">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium ${
            actionMessage.type === "success"
              ? "bg-ayush-green/10 border-ayush-green/30 text-ayush-green"
              : "bg-ayush-terracotta/10 border-ayush-terracotta/30 text-ayush-terracotta"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Controls Bar: Search, Status Filters & Add Institution Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-ayush-card p-4 rounded-xl border border-ayush-border/80 shadow-warm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ayush-muted" />
            <Input
              placeholder="Search by name, code, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "approved", "pending", "suspended", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-ayush-brown text-ayush-card shadow-warm"
                    : "bg-ayush-sand/50 text-ayush-dark hover:bg-ayush-sand"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="h-9 text-xs bg-ayush-brown hover:bg-ayush-brown/90 text-white font-semibold gap-1.5 shadow-warm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Institution</span>
        </Button>
      </div>

      {/* Institutions Table */}
      <div className="rounded-xl border border-ayush-border/80 bg-ayush-card shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ayush-border/80 bg-ayush-sand/40 text-ayush-dark font-heading uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Institution</th>
                <th className="p-4">Type / Location</th>
                <th className="p-4">Affiliated Scholars</th>
                <th className="p-4">Faculty</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ayush-border/60 text-ayush-dark">
              {filtered.length > 0 ? (
                filtered.map((inst) => {
                  const status = inst.verification_status || "approved";
                  const isLoading = loadingId === inst.id;

                  return (
                    <tr key={inst.id} className="hover:bg-ayush-sand/20 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-ayush-sand/60 text-ayush-brown shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-ayush-dark">{inst.name}</div>
                            <div className="text-[11px] text-ayush-muted mt-0.5">
                              Code: {inst.code || "AYUSH-INST"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-ayush-dark font-medium">{inst.category || "Ayurveda College"}</div>
                        <div className="flex items-center gap-1 text-[11px] text-ayush-muted mt-0.5">
                          <MapPin className="w-3 h-3 text-ayush-muted shrink-0" />
                          <span>{inst.location || "India"}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ayush-sand/40 text-ayush-brown font-semibold text-xs">
                          <Users className="w-3.5 h-3.5" />
                          <span>{inst.studentCount} Students</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ayush-sand/40 text-ayush-green font-semibold text-xs">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{inst.facultyCount} Faculty</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {getStatusBadge(status)}
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-ayush-brown" />
                          ) : (
                            <>
                              {status !== "approved" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(inst.id, "approved")}
                                  className="h-7 px-2 text-[11px] font-semibold text-ayush-green hover:bg-ayush-green/10"
                                  title="Approve Institution"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </Button>
                              )}

                              {status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(inst.id, "suspended")}
                                  className="h-7 px-2 text-[11px] font-semibold text-ayush-terracotta hover:bg-ayush-terracotta/10"
                                  title="Suspend Institution"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                  Suspend
                                </Button>
                              )}

                              {status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(inst.id, "rejected")}
                                  className="h-7 px-2 text-[11px] font-semibold text-ayush-terracotta hover:bg-ayush-terracotta/10"
                                  title="Reject Institution"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Reject
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-ayush-muted">
                    No institutions found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddInstitutionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCreationSuccess}
      />
    </div>
  );
}
