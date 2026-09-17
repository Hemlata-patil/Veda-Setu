"use client";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network errors
    }
    router.push("/auth/login");
    router.refresh();
  };

  return <Button onClick={logout}>Logout</Button>;
}
