"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen">
      <RegisterForm onSwitchToLogin={() => router.push("/login")} />
      <Link
        href="/"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-[#6b6b7b] hover:text-[#00d4ff] transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}
