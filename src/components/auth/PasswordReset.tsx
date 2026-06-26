"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

type ResetStep = "email" | "code" | "password";

interface PasswordResetProps {
  onBackToLogin?: () => void;
}

export function PasswordReset({ onBackToLogin }: PasswordResetProps) {
  const [step, setStep] = React.useState<ResetStep>("email");
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{
    email?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = () => {
    if (!email) {
      setErrors({ email: "Email is required" });
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter a valid email" });
      return false;
    }
    setErrors({});
    return true;
  };

  const validatePassword = () => {
    const newErrors: typeof errors = {};
    
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = "Password must contain uppercase, lowercase, and number";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }
      
      toast.success("Reset code sent to your email");
      setStep("code");
      setCountdown(60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setErrors({ code: "Please enter a valid 6-digit code" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired code");
      }
      
      toast.success("Code verified. Enter your new password.");
      setStep("password");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      
      toast.success("Password reset successful!");
      
      if (onBackToLogin) {
        setTimeout(() => onBackToLogin(), 1500);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }
      
      toast.success("New reset code sent to your email");
      setCountdown(60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "code") {
      setStep("email");
      setCode("");
      setErrors({});
    } else if (step === "password") {
      setStep("code");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
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
          <CardTitle className="text-2xl font-bold text-white">
            {step === "email" && "Reset Password"}
            {step === "code" && "Verify Code"}
            {step === "password" && "New Password"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "code" && `Enter the 6-digit code sent to ${email}`}
            {step === "password" && "Enter your new password"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="resetEmail" className="text-sm font-medium text-[#a0a0b0]">
                  Email Address
                </label>
                <Input
                  id="resetEmail"
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
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white shadow-lg shadow-[#0066ff]/25 hover:shadow-[#0066ff]/40"
                isLoading={isLoading}
              >
                Send Reset Code
              </Button>
            </form>
          )}
          
          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-[#a0a0b0]">
                  Verification Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(value);
                    if (errors.code) setErrors({ ...errors, code: undefined });
                  }}
                  error={!!errors.code}
                  disabled={isLoading}
                  className="bg-[#0a0a0f] border-[#2a2a3e] focus:border-[#0066ff]/50 focus:ring-[#0066ff]/20 text-center text-lg tracking-widest"
                />
                {errors.code && (
                  <p className="text-xs text-red-500">{errors.code}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white shadow-lg shadow-[#0066ff]/25 hover:shadow-[#0066ff]/40"
                isLoading={isLoading}
              >
                Verify Code
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || isLoading}
                  className="text-sm text-[#00d4ff] hover:text-[#00d4ff]/80 transition-colors disabled:text-[#6b6b7b] disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive code? Resend"}
                </button>
              </div>
            </form>
          )}
          
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-[#a0a0b0]">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                  }}
                  error={!!errors.newPassword}
                  disabled={isLoading}
                  className="bg-[#0a0a0f] border-[#2a2a3e] focus:border-[#0066ff]/50 focus:ring-[#0066ff]/20"
                />
                {errors.newPassword && (
                  <p className="text-xs text-red-500">{errors.newPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmNewPassword" className="text-sm font-medium text-[#a0a0b0]">
                  Confirm New Password
                </label>
                <Input
                  id="confirmNewPassword"
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
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white shadow-lg shadow-[#0066ff]/25 hover:shadow-[#0066ff]/40"
                isLoading={isLoading}
              >
                Reset Password
              </Button>
            </form>
          )}
          
          <div className="mt-6 flex justify-between text-sm">
            <button
              type="button"
              onClick={handleBack}
              className="text-[#6b6b7b] hover:text-[#00d4ff] transition-colors"
            >
              {step !== "email" ? "← Back" : ""}
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-[#00d4ff] hover:text-[#00d4ff]/80 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
