"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIndustryWithAdmin } from "@/app/super-admin/actions";
import { Briefcase, User, Mail, KeyRound, MapPin, Loader2, AlertCircle } from "lucide-react";

interface AddIndustryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (created: { organizationName: string; contactEmail: string }) => void;
}

const ORGANIZATION_TYPE_OPTIONS = [
  "Pharmaceutical / Healthcare",
  "Clinical Research Organization (CRO)",
  "Herbal & Nutraceuticals",
  "Ayush Wellness & Hospitals",
  "Cosmeceuticals & Personal Care",
  "Herbal Cultivation & Supply Chain",
  "Other",
];

export function AddIndustryModal({ isOpen, onClose, onSuccess }: AddIndustryModalProps) {
  const [name, setName] = React.useState("");
  const [organizationType, setOrganizationType] = React.useState("Pharmaceutical / Healthcare");
  const [location, setLocation] = React.useState("");
  const [contactFullName, setContactFullName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setOrganizationType("Pharmaceutical / Healthcare");
    setLocation("");
    setContactFullName("");
    setContactEmail("");
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

    // Frontend validation
    const trimmedName = name.trim();
    const trimmedContactName = contactFullName.trim();
    const trimmedEmail = contactEmail.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage("Organization Name is required.");
      return;
    }
    if (!trimmedContactName) {
      setErrorMessage("Contact Full Name is required.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid contact email address.");
      return;
    }
    if (!temporaryPassword || temporaryPassword.length < 6) {
      setErrorMessage("Temporary password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const result = await createIndustryWithAdmin({
        name: trimmedName,
        organizationType: organizationType.trim() || undefined,
        location: location.trim() || undefined,
        contactFullName: trimmedContactName,
        contactEmail: trimmedEmail,
        temporaryPassword,
      });

      if (result.success) {
        const createdData = {
          organizationName: result.organizationName,
          contactEmail: trimmedEmail,
        };
        resetForm();
        onClose();
        if (onSuccess) {
          onSuccess(createdData);
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to create industry organization.";
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
      title="Add New Industry / Partner"
      description="Provision a verified pharmaceutical, clinical research, or wellness partner organization and its primary login account."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-ayush-terracotta/30 bg-ayush-terracotta/10 text-ayush-terracotta text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Organization Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-ayush-border/50 pb-2">
            <Briefcase className="w-4 h-4 text-ayush-green" />
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-ayush-dark">
              Organization Details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="org-name" className="text-xs font-semibold text-ayush-dark">
                Organization Name <span className="text-ayush-terracotta">*</span>
              </Label>
              <Input
                id="org-name"
                placeholder="e.g. Himalaya Wellness Company"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-type" className="text-xs font-semibold text-ayush-dark">
                Organization Type
              </Label>
              <select
                id="org-type"
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value)}
                disabled={loading}
                className="w-full h-9 rounded-md border border-ayush-border/80 bg-ayush-card px-3 text-xs text-ayush-dark focus:outline-none focus:ring-1 focus:ring-ayush-brown"
              >
                {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-location" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <MapPin className="w-3 h-3 text-ayush-muted" />
                <span>Location</span>
              </Label>
              <Input
                id="org-location"
                placeholder="e.g. Bengaluru, Karnataka"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Industry Account */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-ayush-border/50 pb-2">
            <User className="w-4 h-4 text-ayush-brown" />
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-ayush-dark">
              Industry Account
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-xs font-semibold text-ayush-dark">
                Contact Full Name <span className="text-ayush-terracotta">*</span>
              </Label>
              <Input
                id="contact-name"
                placeholder="e.g. Priya Nair"
                value={contactFullName}
                onChange={(e) => setContactFullName(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <Mail className="w-3 h-3 text-ayush-muted" />
                <span>Contact Email <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="e.g. contact@industrypartner.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="industry-password" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-ayush-muted" />
                <span>Temporary Password <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <Input
                id="industry-password"
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
            className="h-9 text-xs bg-ayush-green hover:bg-ayush-green/90 text-white font-semibold px-4 shadow-warm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Creating Industry...
              </>
            ) : (
              "Create Industry"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
