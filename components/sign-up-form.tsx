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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import { AdminAccessModal } from "@/components/auth/admin-access-modal";
import { useAdminTrigger } from "@/components/auth/use-admin-trigger";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAdminModalOpen, closeAdminModal, handleLogoClick } = useAdminTrigger();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Security: Public registration always defaults strictly to role = student
      await api.post("/auth/register", {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role: "student",
      });

      // Automatically route newly registered student to their student dashboard
      router.push("/student/dashboard");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during registration");
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
        {success ? (
          <Card accent="green" className="shadow-warm-md">
            <CardHeader className="text-center space-y-2">
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
              <CardTitle className="text-2xl font-heading">Account Created</CardTitle>
              <CardDescription className="text-xs">
                Your student account has been created successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-ayush-green/30 bg-ayush-green/10 p-4 text-center text-sm text-ayush-green font-medium">
                Account created successfully. You can now sign in.
              </div>
              <Button asChild variant="default" className="w-full">
                <Link href="/auth/login">Sign In to Portal</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card accent="green" className="shadow-warm-md">
          <CardHeader className="text-center space-y-2">
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
            <CardTitle className="text-2xl font-heading">Register on VEDA SETU</CardTitle>
            <CardDescription className="text-xs">
              Create your account to start your collaborative academic journey
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Student Role Notice */}
            <div className="rounded-xl border border-ayush-border/70 bg-ayush-sand/50 p-3 flex items-start gap-2.5 text-xs text-ayush-dark">
              <Info className="w-4 h-4 text-ayush-green shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-ayush-brown">Public Registration: Student Portal</span>
                <p className="text-[11px] text-ayush-muted leading-relaxed">
                  Faculty, Institution, and Industry roles are authorized through verified organizational onboarding.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="e.g. Dr. / Vaidya / Scholar Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="scholar@institution.edu.in"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat-password">Confirm Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  placeholder="Re-enter password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-ayush-terracotta/10 border border-ayush-terracotta/20 p-2.5 text-xs text-ayush-terracotta font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Complete Student Registration"}
            </Button>

            <div className="mt-4 text-center text-xs text-ayush-muted">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-ayush-brown hover:text-ayush-saffron underline underline-offset-4"
              >
                Sign in to Portal
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
