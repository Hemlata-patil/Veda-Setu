"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "faculty" | "institution" | "industry" | "super_admin";
  fullName: string;
  department: string | null;
  institutionId: string | null;
  organizationId: string | null;
  designation: string | null;
  createdAt: string;
}

export interface AuthMeResponse {
  status: "success";
  user: AuthUser;
}

export interface LoginResponse {
  status: "success";
  message: string;
  user: AuthUser;
  token?: string;
}

export interface RegisterResponse {
  status: "success";
  message: string;
  user: AuthUser;
  token?: string;
}

/**
 * Direct client-side fetch of current user from Express backend /api/auth/me
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await api.get<AuthMeResponse>("/auth/me");
    return res?.user || null;
  } catch {
    return null;
  }
}

/**
 * Client-side React hook for reactive current-user state
 */
export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
  };
}

/**
 * Helper authentication actions
 */
export const authClient = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return await api.post<LoginResponse>("/auth/login", {
      email: email.trim(),
      password,
    });
  },

  registerStudent: async (fullName: string, email: string, password: string): Promise<RegisterResponse> => {
    return await api.post<RegisterResponse>("/auth/register", {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      role: "student",
    });
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  getCurrentUser,
};
