"use client";

import * as React from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = React.useState(false);

  // 如果已经登录，自动跳转到 dashboard
  React.useEffect(() => {
    if (status === "authenticated") {
      window.location.href = "/dashboard";
    }
  }, [status]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!name || name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!acceptTerms) {
      newErrors.terms = "You must accept the terms and conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (e) {
        // 响应不是 JSON，使用状态码作为错误
        throw new Error(`Server error (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || data.detail || data.message || `Registration failed (${response.status})`);
      }

      toast.success("Registration successful! Redirecting to dashboard...");

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error("Auto-login failed, please sign in manually");
        router.push("/login");
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-[#0066ff]/10 to-transparent opacity-50" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-[#00d4ff]/10 to-transparent opacity-50" />
      </div>
      
      <Card className="w-full max-w-md relative border-[#2a2a3e] bg-[#0f0f1a]/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
          <CardDescription>Join DUALAIHUB to get started</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#a0a0b0]">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                error={!!errors.name}
                disabled={isLoading}
                className="bg-[#0a0a0f] border-[#2a2a3e] focus:border-[#0066ff]/50 focus:ring-[#0066ff]/20"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#a0a0b0]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                error={!!errors.email}
                disabled={isLoading}
                className="bg-[#0a0a0f] border-[#2a2a3e] focus:border-[#0066ff]/50 focus:ring-[#0066ff]/20"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#a0a0b0]">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                error={!!errors.password}
                disabled={isLoading}
                className="bg-[#0a0a0f] border-[#2a2a3e] focus:border-[#0066ff]/50 focus:ring-[#0066ff]/20"
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#a0a0b0]">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                error={!!errors.confirmPassword}
                disabled={isLoading}
                className="bg-[#0a0a0f] border-[#2a2a3e] focus:border-[#0066ff]/50 focus:ring-[#0066ff]/20"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex items-start space-x-2">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (errors.terms) setErrors({ ...errors, terms: undefined });
                }}
                disabled={isLoading}
                className="mt-1 h-4 w-4 rounded border-[#2a2a3e] bg-[#0a0a0f] text-[#0066ff] focus:ring-[#0066ff]/20 disabled:cursor-not-allowed"
              />
              <label htmlFor="terms" className="text-sm text-[#6b6b7b]">
                I agree to the{" "}
                <a href="/terms" className="text-[#00d4ff] hover:text-[#00d4ff]/80">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-[#00d4ff] hover:text-[#00d4ff]/80">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-500">{errors.terms}</p>
            )}
            
            <div className="rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 p-3">
              <p className="text-xs text-[#00d4ff]">
                <span className="font-medium">Email Verification:</span> After registration, 
                you&apos;ll receive a verification email. Please check your inbox and click 
                the verification link to activate your account.
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white shadow-lg shadow-[#0066ff]/25 hover:shadow-[#0066ff]/40"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-[#6b6b7b]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#00d4ff] hover:text-[#00d4ff]/80 transition-colors font-medium"
            >
              Sign In
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
