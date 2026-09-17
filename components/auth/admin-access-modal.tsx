"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, X, AlertCircle, Loader2 } from "lucide-react";

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = React.useCallback(() => {
    if (isLoading) return;
    setError(null);
    setEmail("");
    setPassword("");
    onClose();
  }, [isLoading, onClose]);

  // Handle Escape key and body scroll lock
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, handleClose]);

  if (!isOpen || !mounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        status: string;
        user: { id: string; email: string; role: string };
      }>("/auth/login", {
        email: email.trim(),
        password,
      });

      if (!res?.user || res.user.role !== "super_admin") {
        // Sign out non-admin session immediately
        try {
          await api.post("/auth/logout");
        } catch {
          // Ignore
        }
        setError("Administrator access denied.");
        setIsLoading(false);
        return;
      }

      // Valid super_admin: Navigate directly to super admin dashboard
      router.push("/super-admin/dashboard");
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ayush-dark/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-ayush-border/80 bg-ayush-card p-6 shadow-2xl transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1 text-ayush-muted hover:bg-ayush-sand/50 hover:text-ayush-dark transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ayush-brown text-ayush-saffron shadow-warm mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <h2 id="admin-modal-title" className="font-heading text-xl font-bold text-ayush-dark">
            Administrative Access
          </h2>
          <p className="text-xs text-ayush-muted mt-1">
            Restricted zone. Super Admin credentials required.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-ayush-terracotta/30 bg-ayush-terracotta/10 p-3 text-xs text-ayush-terracotta">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email" className="text-xs font-semibold text-ayush-dark">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              required
              autoFocus
              placeholder="superadmin@ayush.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="text-xs font-semibold text-ayush-dark">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-10 text-sm"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-ayush-brown text-ayush-card hover:bg-ayush-brown/90 shadow-warm font-medium text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-ayush-saffron" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-ayush-saffron" />
                  <span>Secure Admin Login</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
