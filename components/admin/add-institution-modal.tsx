"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInstitutionWithAdmin } from "@/app/super-admin/actions";
import { Building2, User, Mail, KeyRound, MapPin, Tag, Loader2, AlertCircle } from "lucide-react";

interface AddInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (created: { institutionName: string; adminEmail: string }) => void;
}

const CATEGORY_OPTIONS = [
  "Ayurveda Medical College",
  "National Institute of Ayurveda",
  "Ayurvedic Hospital & Research Center",
  "Ayush Deemed / State University",
  "Homoeopathy Medical College",
  "Unani Medical College",
  "Siddha Medical College",
  "Other",
];

export function AddInstitutionModal({ isOpen, onClose, onSuccess }: AddInstitutionModalProps) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [category, setCategory] = React.useState("Ayurveda Medical College");
  const [location, setLocation] = React.useState("");
  const [adminFullName, setAdminFullName] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setCode("");
    setCategory("Ayurveda Medical College");
    setLocation("");
    setAdminFullName("");
    setAdminEmail("");
    setTemporaryPassword("");
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Frontend validation
    const trimmedName = name.trim();
    const trimmedAdminName = adminFullName.trim();
    const trimmedEmail = adminEmail.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage("Institution Name is required.");
      return;
    }
    if (!trimmedAdminName) {
      setErrorMessage("Admin Full Name is required.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid administrator email address.");
      return;
    }
    if (!temporaryPassword || temporaryPassword.length < 6) {
      setErrorMessage("Temporary password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const result = await createInstitutionWithAdmin({
        name: trimmedName,
        code: code.trim() || undefined,
        category: category.trim() || undefined,
        location: location.trim() || undefined,
        adminFullName: trimmedAdminName,
        adminEmail: trimmedEmail,
        temporaryPassword,
      });

      if (result.success) {
        const createdData = {
          institutionName: result.institutionName,
          adminEmail: trimmedEmail,
        };
        resetForm();
        onClose();
        if (onSuccess) {
          onSuccess(createdData);
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to create institution.";
      if (
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("unique constraint")
      ) {
        setErrorMessage("This email is already registered. Use a different email.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Institution"
      description="Provision an accredited AYUSH academic institution and its administrative login account."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-ayush-terracotta/30 bg-ayush-terracotta/10 text-ayush-terracotta text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Institution Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-ayush-border/50 pb-2">
            <Building2 className="w-4 h-4 text-ayush-brown" />
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-ayush-dark">
              Institution Details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="inst-name" className="text-xs font-semibold text-ayush-dark">
                Institution Name <span className="text-ayush-terracotta">*</span>
              </Label>
              <Input
                id="inst-name"
                placeholder="e.g. Government Ayurveda Medical College"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inst-code" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <Tag className="w-3 h-3 text-ayush-muted" />
                <span>Institution Code</span>
              </Label>
              <Input
                id="inst-code"
                placeholder="e.g. GAMC-BLR"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inst-category" className="text-xs font-semibold text-ayush-dark">
                Category
              </Label>
              <select
                id="inst-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="w-full h-9 rounded-md border border-ayush-border/80 bg-ayush-card px-3 text-xs text-ayush-dark focus:outline-none focus:ring-1 focus:ring-ayush-brown"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="inst-location" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <MapPin className="w-3 h-3 text-ayush-muted" />
                <span>Location</span>
              </Label>
              <Input
                id="inst-location"
                placeholder="e.g. Bengaluru, Karnataka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Institution Admin Account */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-ayush-border/50 pb-2">
            <User className="w-4 h-4 text-ayush-green" />
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-ayush-dark">
              Institution Administrator Account
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name" className="text-xs font-semibold text-ayush-dark">
                Admin Full Name <span className="text-ayush-terracotta">*</span>
              </Label>
              <Input
                id="admin-name"
                placeholder="e.g. Dr. Ramesh Sharma"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <Mail className="w-3 h-3 text-ayush-muted" />
                <span>Admin Email <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="e.g. admin@gamc.edu.in"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-ayush-muted" />
                <span>Temporary Password <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
              <p className="text-[11px] text-ayush-muted leading-relaxed">
                This password is for initial access. The account holder should change it later.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-ayush-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-9 text-xs bg-ayush-brown hover:bg-ayush-brown/90 text-white font-semibold px-4 shadow-warm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Creating Institution...
              </>
            ) : (
              "Create Institution"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
