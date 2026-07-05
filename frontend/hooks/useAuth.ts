"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { AuthResponse, User } from "@/types";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
        setAuth(data.user, data.access_token);
        // Redirect is the caller's responsibility — no router.push here
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Login failed";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [setAuth]
  );

  const signup = useCallback(
    async (form: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      date_of_birth?: string;
      phone?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post<AuthResponse>("/api/auth/signup", form);
        setAuth(data.user, data.access_token);
        // Redirect is the caller's responsibility — no router.push here
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Signup failed";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  // Restore session from refresh token cookie on mount
  const restoreSession = useCallback(async () => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("helixa_token") : null;
    if (stored && !isAuthenticated) {
      try {
        const { data } = await api.get<User>("/api/auth/me");
        setAuth(data, stored);
      } catch {
        clearAuth();
      }
    }
  }, [isAuthenticated, setAuth, clearAuth]);

  return { user, isAuthenticated, loading, error, login, signup, logout, restoreSession };
}
