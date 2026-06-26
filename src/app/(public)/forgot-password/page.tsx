"use client";

import { PasswordReset } from "@/components/auth/PasswordReset";

export default function ForgotPasswordPage() {
  return (
    <PasswordReset onBackToLogin={() => window.location.href = "/login"} />
  );
}
