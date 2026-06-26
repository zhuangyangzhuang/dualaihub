"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, register, setUser, setLoading, setError, clearError } = useAuthStore();
  const router = useRouter();

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }, [login, setLoading, setError, clearError, router]);

  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      clearError();
      await register(name, email, password);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }, [register, setLoading, setError, clearError, router]);

  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);
      await logout();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  }, [logout, setLoading, router]);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    } catch (err: any) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    checkAuth,
    clearError,
  };
}
