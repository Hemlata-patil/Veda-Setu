"use client";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AdminAccessModal } from "@/components/auth/admin-access-modal";
import { useAdminTrigger } from "@/components/auth/use-admin-trigger";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAdminModalOpen, closeAdminModal, handleLogoClick } = useAdminTrigger();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AdminAccessModal
        isOpen={isAdminModalOpen}
        onClose={closeAdminModal}
      />
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex justify-center mb-1">
          <button
            type="button"
            onClick={handleLogoClick}
            className="cursor-pointer transition-transform hover:scale-105 select-none focus:outline-none"
            title="VEDA SETU"
            aria-label="Veda Setu"
          >
            <Image
              src="/images/veda-setu-logo.png"
              alt="Veda Setu"
              width={200}
              height={70}
              className="h-12 w-auto object-contain mx-auto"
              priority
            />
          </button>
        </div>
        {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your email to receive password reset instructions for VEDA SETU
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset email"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
