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
import { AdminAccessModal } from "@/components/auth/admin-access-modal";
import { useAdminTrigger } from "@/components/auth/use-admin-trigger";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAdminModalOpen, closeAdminModal, handleLogoClick } = useAdminTrigger();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      // Redirect to /dashboard which performs secure role-based dispatch
      router.push("/dashboard");
      router.refresh();
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
        <Card accent="saffron" className="shadow-warm-md">
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
            <CardTitle className="text-2xl font-heading">Sign In to VEDA SETU</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access your collaborative portal
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-ayush-brown hover:text-ayush-saffron hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="rounded-lg bg-ayush-terracotta/10 border border-ayush-terracotta/20 p-2.5 text-xs text-ayush-terracotta font-medium">
                {error}
              </div>
            )}
            <Button
              type="submit"
              variant="default"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In to Portal"}
            </Button>

            <div className="mt-4 text-center text-xs text-ayush-muted">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-ayush-brown hover:text-ayush-saffron underline underline-offset-4"
              >
                Register as Student
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
