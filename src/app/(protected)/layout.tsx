"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-[#0066ff]" />
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-[#0066ff]/20" />
          </div>
          <p className="text-sm text-white/60">Loading your workspace...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <div className="min-h-screen pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
