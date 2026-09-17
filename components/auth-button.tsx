"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    api
      .get<{ status: string; user: AuthUser }>("/auth/me")
      .then((res) => {
        if (isMounted && res?.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network errors
    }
    setUser(null);
    router.push("/auth/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 bg-ayush-stone/20 animate-pulse rounded-md" />
        <div className="h-8 w-20 bg-ayush-stone/20 animate-pulse rounded-md" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="default" className="gap-2">
          <Link href="/dashboard">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Go to Dashboard</span>
          </Link>
        </Button>
        <Button
          onClick={handleSignOut}
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs text-ayush-muted hover:text-ayush-terracotta"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/auth/sign-up">Register</Link>
      </Button>
    </div>
  );
}
