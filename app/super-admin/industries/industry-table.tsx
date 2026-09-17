"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOrganizationStatus, VerificationStatus } from "@/app/super-admin/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { AddIndustryModal } from "@/components/admin/add-industry-modal";
import {
  Briefcase,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Compass,
  MapPin,
  Loader2,
  Plus,
} from "lucide-react";

export interface OrganizationRow {
  id: string;
  name: string;
  organization_type?: string | null;
  location?: string | null;
  verification_status?: string | null;
  opportunityCount: number;
  created_at: string;
}

export function IndustryTable({ initialOrganizations }: { initialOrganizations: OrganizationRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = React.useState(initialOrganizations);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Sync state with server revalidations
  React.useEffect(() => {
    setOrganizations(initialOrganizations);
  }, [initialOrganizations]);

  // Auto-open modal if navigated with ?action=add
  React.useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleCreationSuccess = (created: { organizationName: string; contactEmail: string }) => {
    setActionMessage({
      text: `Industry "${created.organizationName}" successfully created. Partner contact account provisioned: ${created.contactEmail}`,
      type: "success",
    });
    router.refresh();
  };

  const filtered = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      (org.organization_type && org.organization_type.toLowerCase().includes(search.toLowerCase())) ||
      (org.location && org.location.toLowerCase().includes(search.toLowerCase()));

    const status = org.verification_status || "approved";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (organizationId: string, newStatus: VerificationStatus) => {
    setLoadingId(organizationId);
    setActionMessage(null);

    try {
      await updateOrganizationStatus(organizationId, newStatus);
      setOrganizations((prev) =>
        prev.map((org) =>
          org.id === organizationId ? { ...org, verification_status: newStatus } : org
        )
      );
      setActionMessage({
        text: `Organization status updated to ${newStatus}.`,
        type: "success",
      });
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Failed to update organization status.",
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
      {/* Action Notification */}
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

      {/* Controls Bar: Search, Status Filters & Add Industry Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-ayush-card p-4 rounded-xl border border-ayush-border/80 shadow-warm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ayush-muted" />
            <Input
              placeholder="Search by name, type, location..."
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
          className="h-9 text-xs bg-ayush-green hover:bg-ayush-green/90 text-white font-semibold gap-1.5 shadow-warm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Industry</span>
        </Button>
      </div>

      {/* Organizations Table */}
      <div className="rounded-xl border border-ayush-border/80 bg-ayush-card shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ayush-border/80 bg-ayush-sand/40 text-ayush-dark font-heading uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Industry / Organization</th>
                <th className="p-4">Type</th>
                <th className="p-4">Location</th>
                <th className="p-4">Opportunities</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ayush-border/60 text-ayush-dark">
              {filtered.length > 0 ? (
                filtered.map((org) => {
                  const status = org.verification_status || "approved";
                  const isLoading = loadingId === org.id;

                  return (
                    <tr key={org.id} className="hover:bg-ayush-sand/20 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-ayush-sand/60 text-ayush-green shrink-0 mt-0.5">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-ayush-dark">{org.name}</div>
                            <div className="text-[11px] text-ayush-muted mt-0.5">
                              ID: {org.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="capitalize font-medium text-ayush-dark">
                          {org.organization_type || "Pharmaceutical / Clinical"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1 text-[11px] text-ayush-muted">
                          <MapPin className="w-3 h-3 text-ayush-muted shrink-0" />
                          <span>{org.location || "India"}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ayush-sand/40 text-ayush-brown font-semibold text-xs">
                          <Compass className="w-3.5 h-3.5" />
                          <span>{org.opportunityCount} Listed</span>
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
                                  onClick={() => handleStatusChange(org.id, "approved")}
                                  className="h-7 px-2 text-[11px] font-semibold text-ayush-green hover:bg-ayush-green/10"
                                  title="Approve Organization"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </Button>
                              )}

                              {status === "approved" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(org.id, "suspended")}
                                  className="h-7 px-2 text-[11px] font-semibold text-ayush-terracotta hover:bg-ayush-terracotta/10"
                                  title="Suspend Organization"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                  Suspend
                                </Button>
                              )}

                              {status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(org.id, "rejected")}
                                  className="h-7 px-2 text-[11px] font-semibold text-ayush-terracotta hover:bg-ayush-terracotta/10"
                                  title="Reject Organization"
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
                    No organizations found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddIndustryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCreationSuccess}
      />
    </div>
  );
}
