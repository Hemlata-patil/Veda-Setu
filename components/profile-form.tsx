"use client";

import * as React from "react";
import { UserProfile } from "@/lib/auth";
import { updateProfile } from "@/app/profile/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, AlertTriangle, Save, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface InstitutionOption {
  id: string;
  name: string;
  code: string | null;
}

interface ProfileFormProps {
  profile: UserProfile;
  email: string;
  institutions?: InstitutionOption[];
  currentInstitutionName?: string | null;
}

export function ProfileForm({
  profile,
  email,
  institutions = [],
  currentInstitutionName = null,
}: ProfileFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = React.useState(profile.full_name || "");
  const [phone, setPhone] = React.useState(profile.phone || "");
  const [department, setDepartment] = React.useState(profile.department || "");
  const [program, setProgram] = React.useState(profile.program || "");
  const [year, setYear] = React.useState(profile.year ? String(profile.year) : "");
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url || "");
  const [institutionId, setInstitutionId] = React.useState(profile.institution_id || "");

  const [isSaving, setIsSaving] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Derive display institution name
  const activeInstitutionName =
    institutions.find((inst) => inst.id === institutionId)?.name ||
    currentInstitutionName ||
    (institutionId ? "Affiliated" : "Not Affiliated");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateProfile({
        fullName,
        phone,
        department,
        program,
        year: year ? parseInt(year, 10) : null,
        avatarUrl,
        institutionId: profile.role === "student" ? institutionId || null : undefined,
      });

      setStatusMessage({
        type: "success",
        text: "Profile updated successfully. Changes are now reflected across the platform.",
      });

      router.refresh();
    } catch (err: unknown) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Readonly Account Governance Card */}
      <Card className="bg-ayush-sand/30 border-ayush-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">System Credentials & Role Governance</CardTitle>
            <Badge
              variant={
                profile.role === "student"
                  ? "herbal"
                  : profile.role === "faculty"
                  ? "saffron"
                  : "default"
              }
              className="uppercase"
            >
              {profile.role}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Core identity and role authorization managed by platform governance
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-ayush-muted">Registered Email</span>
            <div className="text-xs font-semibold text-ayush-dark truncate">{email}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-ayush-muted">Assigned System Role</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ayush-dark capitalize">
              <Lock className="w-3 h-3 text-ayush-muted" />
              <span>{profile.role} (Immutable)</span>
            </div>
          </div>

          {profile.role === "student" ? (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-ayush-muted">Academic Affiliation</span>
              <div className="text-xs font-semibold text-ayush-dark truncate" title={activeInstitutionName}>
                {activeInstitutionName}
              </div>
            </div>
          ) : currentInstitutionName ? (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-ayush-muted">Affiliated Institution</span>
              <div className="text-xs font-semibold text-ayush-dark truncate" title={currentInstitutionName}>
                {currentInstitutionName}
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-ayush-muted">Profile Created</span>
            <div className="text-xs text-ayush-muted">
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Active"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile Form */}
      <Card accent="green">
        <CardHeader>
          <CardTitle>Edit Academic & Professional Details</CardTitle>
          <CardDescription className="text-xs">
            Update your public profile and educational coordinates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Vaidya Ramanathan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Academic Institution Dropdown - ONLY for student role */}
            {profile.role === "student" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="institution_id" className="flex items-center gap-1.5 font-medium text-ayush-dark">
                    <Building2 className="w-3.5 h-3.5 text-ayush-green" />
                    <span>Academic Institution *</span>
                  </Label>
                  <span className="text-[11px] text-ayush-muted">Required for institutional mentorship</span>
                </div>
                <select
                  id="institution_id"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full h-10 rounded-md border border-ayush-border/80 bg-ayush-card px-3 text-xs sm:text-sm text-ayush-dark focus:outline-none focus:ring-1 focus:ring-ayush-green shadow-xs"
                >
                  <option value="">-- Select Enrolled Academic Institution --</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} {inst.code ? `(${inst.code})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-ayush-muted leading-relaxed">
                  Select your approved college or university. This affiliates your student profile with faculty mentors in your institution.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department / Specialization</Label>
                <Input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Dravyaguna / Kayachikitsa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Academic Program / Degree</Label>
                <Input
                  id="program"
                  type="text"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. BAMS / MD (Ayurveda)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Academic Year / Experience</Label>
                <Input
                  id="year"
                  type="number"
                  min={1}
                  max={50}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar Image URL (Optional)</Label>
              <Input
                id="avatar_url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-ayush-green/10 border-ayush-green/30 text-ayush-green"
                    : "bg-ayush-terracotta/10 border-ayush-terracotta/30 text-ayush-terracotta"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="submit"
                variant="secondary"
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
