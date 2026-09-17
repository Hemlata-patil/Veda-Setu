"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFacultyAccount } from "@/app/institution/actions";
import { User, Mail, KeyRound, Briefcase, GraduationCap, Building2, Lock, Loader2, AlertCircle } from "lucide-react";

interface AddFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionName: string;
  onSuccess?: (created: { fullName: string; email: string; designation: string; department: string }) => void;
}

const DESIGNATION_OPTIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "HOD",
  "Dean",
  "Principal",
  "Lecturer",
  "Other",
];

const COMMON_DEPARTMENTS = [
  "Kayachikitsa (Internal Medicine)",
  "Panchakarma (Bio-Purification Therapy)",
  "Shalya Tantra (Surgery)",
  "Shalakya Tantra (ENT & Ophthalmology)",
  "Prasuti Tantra & Stri Roga (Obstetrics & Gynecology)",
  "Kaumarbhritya (Pediatrics)",
  "Dravyaguna Vijnana (Pharmacology & Materia Medica)",
  "Rasa Shastra & Bhaishajya Kalpana (Iatrochemistry & Pharmacy)",
  "Samhita & Siddhanta (Basic Principles & Philosophy)",
  "Sharira Rachana (Anatomy)",
  "Sharira Kriya (Physiology)",
  "Swasthavritta & Yoga (Preventive Medicine)",
  "Agada Tantra (Toxicology & Forensic Medicine)",
  "Roga Nidana (Pathology & Diagnostics)",
  "Other Academic Department",
];

export function AddFacultyModal({ isOpen, onClose, institutionName, onSuccess }: AddFacultyModalProps) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState("");
  const [designation, setDesignation] = React.useState("Assistant Professor");
  const [department, setDepartment] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setTemporaryPassword("");
    setDesignation("Assistant Professor");
    setDepartment("");
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
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedDepartment = department.trim();
    const trimmedDesignation = designation.trim();

    if (!trimmedFullName) {
      setErrorMessage("Faculty Full Name is required.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid academic email address.");
      return;
    }
    if (!trimmedDesignation) {
      setErrorMessage("Designation is required.");
      return;
    }
    if (!trimmedDepartment) {
      setErrorMessage("Department is required.");
      return;
    }
    if (!temporaryPassword || temporaryPassword.length < 6) {
      setErrorMessage("Temporary password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // NOTE: institution_id is NOT sent from the browser. The server action
      // derives it strictly from the authenticated caller's profile.
      const result = await createFacultyAccount({
        fullName: trimmedFullName,
        email: trimmedEmail,
        designation: trimmedDesignation,
        department: trimmedDepartment,
        temporaryPassword,
      });

      if (result.success) {
        const createdData = {
          fullName: trimmedFullName,
          email: trimmedEmail,
          designation: trimmedDesignation,
          department: trimmedDepartment,
        };
        resetForm();
        onClose();
        if (onSuccess) {
          onSuccess(createdData);
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to create faculty account.";
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
      title="Add Campus Faculty"
      description="Provision an academic faculty mentor account affiliated to your campus."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-ayush-terracotta/30 bg-ayush-terracotta/10 text-ayush-terracotta text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Read-Only Locked Institution Banner */}
        <div className="p-3 bg-ayush-sand/30 border border-ayush-border/70 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 text-ayush-muted font-medium">
            <Building2 className="w-4 h-4 text-ayush-brown" />
            <span>Institution Affiliation:</span>
          </div>
          <div className="inline-flex items-center gap-1.5 font-bold text-ayush-dark bg-ayush-card px-2.5 py-1 rounded-md border border-ayush-border/60">
            <span>{institutionName}</span>
            <span title="Fixed to authenticated institution">
              <Lock className="w-3.5 h-3.5 text-ayush-brown" />
            </span>
          </div>
        </div>

        {/* Faculty Details Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-ayush-border/50 pb-2">
            <User className="w-4 h-4 text-ayush-green" />
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-ayush-dark">
              Faculty Details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="faculty-name" className="text-xs font-semibold text-ayush-dark">
                Full Name <span className="text-ayush-terracotta">*</span>
              </Label>
              <Input
                id="faculty-name"
                placeholder="e.g. Dr. Vaidya Ananya Deshmukh"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="faculty-email" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <Mail className="w-3 h-3 text-ayush-muted" />
                <span>Email <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <Input
                id="faculty-email"
                type="email"
                placeholder="e.g. ananya.d@ayurveda.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="faculty-designation" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-ayush-muted" />
                <span>Designation <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <select
                id="faculty-designation"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                disabled={loading}
                className="w-full h-9 rounded-md border border-ayush-border/80 bg-ayush-card px-3 text-xs text-ayush-dark focus:outline-none focus:ring-1 focus:ring-ayush-brown"
                required
              >
                {DESIGNATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="faculty-department" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-ayush-muted" />
                <span>Department <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <input
                id="faculty-department"
                list="department-suggestions"
                placeholder="e.g. Kayachikitsa or Panchakarma"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading}
                className="w-full h-9 rounded-md border border-ayush-border/80 bg-ayush-card px-3 text-xs text-ayush-dark focus:outline-none focus:ring-1 focus:ring-ayush-brown"
                required
              />
              <datalist id="department-suggestions">
                {COMMON_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="faculty-password" className="text-xs font-semibold text-ayush-dark flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-ayush-muted" />
                <span>Temporary Password <span className="text-ayush-terracotta">*</span></span>
              </Label>
              <Input
                id="faculty-password"
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
                Creating Faculty...
              </>
            ) : (
              "Add Faculty"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
