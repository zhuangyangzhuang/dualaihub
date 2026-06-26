"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen">
      <LoginForm
        onSwitchToRegister={() => router.push("/register")}
        onForgotPassword={() => router.push("/forgot-password")}
      />
      <Link
        href="/"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-[#6b6b7b] hover:text-[#00d4ff] transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}
