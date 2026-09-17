"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moderateOpportunityStatus } from "@/app/super-admin/actions";
import {
  Compass,
  Search,
  Archive,
  Ban,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Eye,
  X,
  Loader2,
} from "lucide-react";

export interface OpportunityRow {
  id: string;
  title: string;
  description: string;
  opportunity_type: string;
  status: string;
  location?: string | null;
  stipend?: string | null;
  application_deadline?: string | null;
  organizationName?: string | null;
  creatorName?: string | null;
  creatorEmail?: string | null;
  created_at: string;
}

export function OpportunityModerationTable({
  initialOpportunities,
}: {
  initialOpportunities: OpportunityRow[];
}) {
  const [opportunities, setOpportunities] = React.useState(initialOpportunities);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [viewingOpp, setViewingOpp] = React.useState<OpportunityRow | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const filtered = opportunities.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.organizationName && o.organizationName.toLowerCase().includes(search.toLowerCase())) ||
      (o.creatorName && o.creatorName.toLowerCase().includes(search.toLowerCase())) ||
      o.opportunity_type.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleModerate = async (
    opportunityId: string,
    newStatus: "published" | "closed" | "archived"
  ) => {
    setLoadingId(opportunityId);
    setActionMessage(null);

    try {
      await moderateOpportunityStatus(opportunityId, newStatus);
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opportunityId ? { ...o, status: newStatus } : o))
      );
      setActionMessage({
        text: `Opportunity status changed to ${newStatus}.`,
        type: "success",
      });
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Failed to moderate opportunity.",
        type: "error",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="herbal" className="text-[10px] uppercase">Published</Badge>;
      case "closed":
        return <Badge variant="saffron" className="text-[10px] uppercase">Closed</Badge>;
      case "archived":
        return <Badge variant="destructive" className="text-[10px] uppercase">Archived</Badge>;
      case "draft":
      default:
        return <Badge variant="default" className="text-[10px] uppercase">Draft</Badge>;
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

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-ayush-card p-4 rounded-xl border border-ayush-border/80 shadow-warm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ayush-muted" />
          <Input
            placeholder="Search opportunities, org, creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "published", "closed", "archived", "draft"].map((st) => (
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

      {/* Table */}
      <div className="rounded-xl border border-ayush-border/80 bg-ayush-card shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ayush-border/80 bg-ayush-sand/40 text-ayush-dark font-heading uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Opportunity</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Creator / Date</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ayush-border/60 text-ayush-dark">
              {filtered.length > 0 ? (
                filtered.map((opp) => {
                  const isLoading = loadingId === opp.id;

                  return (
                    <tr key={opp.id} className="hover:bg-ayush-sand/20 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="font-semibold text-xs text-ayush-dark line-clamp-1">
                          {opp.title}
                        </div>
                        <div className="text-[11px] text-ayush-muted line-clamp-1 mt-0.5">
                          {opp.location || "Remote / Hybrid"} • Stipend: {opp.stipend || "As per norms"}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-ayush-dark flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-ayush-brown shrink-0" />
                          <span className="truncate max-w-xs">{opp.organizationName || "Industry Partner"}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="capitalize font-medium">{opp.opportunity_type}</span>
                      </td>

                      <td className="p-4">
                        {getStatusBadge(opp.status)}
                      </td>

                      <td className="p-4 text-ayush-muted whitespace-nowrap">
                        {opp.application_deadline
                          ? new Date(opp.application_deadline).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Rolling"}
                      </td>

                      <td className="p-4 text-ayush-muted">
                        <div className="truncate max-w-xs text-ayush-dark font-medium">
                          {opp.creatorName || "Staff"}
                        </div>
                        <div className="text-[10px] text-ayush-muted">
                          {new Date(opp.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-ayush-brown" />
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setViewingOpp(opp)}
                                className="h-7 px-2 text-[11px] text-ayush-brown hover:bg-ayush-sand/50"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>

                              {opp.status === "published" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleModerate(opp.id, "closed")}
                                  className="h-7 px-2 text-[11px] text-ayush-terracotta hover:bg-ayush-terracotta/10"
                                  title="Close Opportunity"
                                >
                                  <Ban className="w-3.5 h-3.5 mr-1" />
                                  Close
                                </Button>
                              )}

                              {opp.status !== "archived" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleModerate(opp.id, "archived")}
                                  className="h-7 px-2 text-[11px] text-ayush-muted hover:text-ayush-terracotta hover:bg-ayush-terracotta/10"
                                  title="Archive Inappropriate/Obsolete Opportunity"
                                >
                                  <Archive className="w-3.5 h-3.5 mr-1" />
                                  Archive
                                </Button>
                              )}

                              {opp.status === "closed" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleModerate(opp.id, "published")}
                                  className="h-7 px-2 text-[11px] text-ayush-green hover:bg-ayush-green/10"
                                  title="Re-open / Publish"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Publish
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
                  <td colSpan={7} className="p-8 text-center text-xs text-ayush-muted">
                    No opportunities found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {viewingOpp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ayush-dark/50 p-4 backdrop-blur-sm"
          onClick={() => setViewingOpp(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-ayush-border/80 bg-ayush-card p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-ayush-border/70 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-ayush-saffron tracking-wider">
                  Opportunity Moderation View
                </span>
                <h3 className="font-heading font-bold text-base text-ayush-dark mt-0.5">
                  {viewingOpp.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingOpp(null)}
                className="p-1 rounded text-ayush-muted hover:text-ayush-dark"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-ayush-sand/30 border border-ayush-border/60">
                <div>
                  <span className="text-ayush-muted">Organization:</span>
                  <div className="font-semibold text-ayush-dark">{viewingOpp.organizationName || "—"}</div>
                </div>
                <div>
                  <span className="text-ayush-muted">Type:</span>
                  <div className="font-semibold text-ayush-dark capitalize">{viewingOpp.opportunity_type}</div>
                </div>
                <div>
                  <span className="text-ayush-muted">Location:</span>
                  <div className="font-semibold text-ayush-dark">{viewingOpp.location || "Remote / On-site"}</div>
                </div>
                <div>
                  <span className="text-ayush-muted">Stipend:</span>
                  <div className="font-semibold text-ayush-dark">{viewingOpp.stipend || "Unspecified"}</div>
                </div>
                <div>
                  <span className="text-ayush-muted">Deadline:</span>
                  <div className="font-semibold text-ayush-dark">{viewingOpp.application_deadline || "Ongoing"}</div>
                </div>
                <div>
                  <span className="text-ayush-muted">Created By:</span>
                  <div className="font-semibold text-ayush-dark">{viewingOpp.creatorName || viewingOpp.creatorEmail || "Staff"}</div>
                </div>
              </div>

              <div>
                <span className="font-semibold text-ayush-dark">Description:</span>
                <div className="mt-1 p-3 rounded-lg bg-ayush-sand/20 border border-ayush-border/50 text-ayush-dark/90 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {viewingOpp.description}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-ayush-border/70">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-ayush-muted">Status:</span>
                {getStatusBadge(viewingOpp.status)}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingOpp(null)}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
