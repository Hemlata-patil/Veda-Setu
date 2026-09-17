"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserRole } from "@/app/super-admin/actions";
import {
  Users,
  Search,
  Shield,
  GraduationCap,
  Building2,
  Briefcase,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit2,
  X,
} from "lucide-react";

export interface UserProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "faculty" | "institution" | "industry" | "super_admin";
  phone?: string | null;
  institutionName?: string | null;
  organizationName?: string | null;
  department?: string | null;
  program?: string | null;
  created_at: string;
}

export function UserTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserProfileRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = React.useState(initialUsers);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [editingUser, setEditingUser] = React.useState<UserProfileRow | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase())) ||
      (u.institutionName && u.institutionName.toLowerCase().includes(search.toLowerCase())) ||
      (u.organizationName && u.organizationName.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleOpenEdit = (user: UserProfileRow) => {
    if (user.role === "super_admin" || user.id === currentUserId) return;
    setEditingUser(user);
    setSelectedRole(user.role);
    setActionMessage(null);
  };

  const handleConfirmRoleChange = async () => {
    if (!editingUser) return;
    if (selectedRole === editingUser.role) {
      setEditingUser(null);
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      await updateUserRole(
        editingUser.id,
        selectedRole as "student" | "faculty" | "institution" | "industry"
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, role: selectedRole as any } : u
        )
      );
      setActionMessage({
        text: `Role for ${editingUser.full_name} changed to ${selectedRole}.`,
        type: "success",
      });
      setEditingUser(null);
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Failed to change user role.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="default" className="text-[10px] uppercase bg-ayush-brown text-ayush-saffron border border-ayush-saffron/30">Super Admin</Badge>;
      case "faculty":
        return <Badge variant="saffron" className="text-[10px] uppercase">Faculty</Badge>;
      case "institution":
        return <Badge variant="default" className="text-[10px] uppercase">Institution</Badge>;
      case "industry":
        return <Badge variant="default" className="text-[10px] uppercase">Industry</Badge>;
      case "student":
      default:
        return <Badge variant="herbal" className="text-[10px] uppercase">Student</Badge>;
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

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-ayush-card p-4 rounded-xl border border-ayush-border/80 shadow-warm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ayush-muted" />
          <Input
            placeholder="Search by name, email, org..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "student", "faculty", "institution", "industry", "super_admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                roleFilter === r
                  ? "bg-ayush-brown text-ayush-card shadow-warm"
                  : "bg-ayush-sand/50 text-ayush-dark hover:bg-ayush-sand"
              }`}
            >
              {r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-ayush-border/80 bg-ayush-card shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ayush-border/80 bg-ayush-sand/40 text-ayush-dark font-heading uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Affiliation / Organization</th>
                <th className="p-4">Department / Program</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ayush-border/60 text-ayush-dark">
              {filtered.length > 0 ? (
                filtered.map((u) => {
                  const isCurrentUser = u.id === currentUserId;
                  const isSuperAdmin = u.role === "super_admin";
                  const canEdit = !isSuperAdmin && !isCurrentUser;

                  return (
                    <tr key={u.id} className="hover:bg-ayush-sand/20 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ayush-sand text-ayush-brown font-semibold flex items-center justify-center text-xs shrink-0">
                            {u.full_name ? u.full_name.slice(0, 2).toUpperCase() : "AU"}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-ayush-dark flex items-center gap-1.5">
                              <span>{u.full_name || "Unnamed User"}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] text-ayush-muted font-normal">(You)</span>
                              )}
                            </div>
                            <div className="text-[11px] text-ayush-muted mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="p-4">
                        <div className="text-ayush-dark font-medium truncate max-w-xs">
                          {u.institutionName || u.organizationName || "—"}
                        </div>
                        <div className="text-[10px] text-ayush-muted">
                          {u.institutionName ? "Academic Institution" : u.organizationName ? "Industry Partner" : "Individual Scholar"}
                        </div>
                      </td>

                      <td className="p-4 text-ayush-muted">
                        <div>{u.department || "—"}</div>
                        {u.program && <div className="text-[10px] text-ayush-muted">{u.program}</div>}
                      </td>

                      <td className="p-4 text-ayush-muted whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="p-4 text-right">
                        {canEdit ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(u)}
                            className="h-7 px-2 text-[11px] text-ayush-brown hover:bg-ayush-sand/50"
                            title="Edit Role Assignment"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Change Role
                          </Button>
                        ) : isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-ayush-saffron font-semibold px-2 py-0.5 rounded bg-ayush-brown/5">
                            <Shield className="w-3 h-3" />
                            Protected
                          </span>
                        ) : (
                          <span className="text-[11px] text-ayush-muted">Active Session</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-ayush-muted">
                    No users found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ayush-dark/50 p-4 backdrop-blur-sm"
          onClick={() => !isSubmitting && setEditingUser(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-ayush-border/80 bg-ayush-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-ayush-border/70">
              <h3 className="font-heading font-bold text-sm text-ayush-dark">
                Modify Role: {editingUser.full_name}
              </h3>
              <button
                onClick={() => !isSubmitting && setEditingUser(null)}
                className="p-1 rounded text-ayush-muted hover:text-ayush-dark"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-ayush-border/60 bg-ayush-sand/30">
                <div className="text-ayush-muted">Current Role:</div>
                <div className="font-semibold text-ayush-dark capitalize mt-0.5">
                  {editingUser.role}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ayush-dark">Assign New Role:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-9 rounded-lg border border-ayush-border/80 bg-ayush-card px-3 text-xs text-ayush-dark focus:outline-none focus:border-ayush-green"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="institution">Institution</option>
                  <option value="industry">Industry</option>
                </select>
                <p className="text-[11px] text-ayush-muted">
                  Note: Super Admin role cannot be assigned directly through browser actions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ayush-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={isSubmitting}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRoleChange}
                disabled={isSubmitting || selectedRole === editingUser.role}
                className="h-8 text-xs bg-ayush-brown text-ayush-card hover:bg-ayush-brown/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Updating...
                  </>
                ) : (
                  "Confirm Role Change"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
