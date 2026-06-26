"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  DollarSign,
  Coins,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { isAdmin as checkAdmin } from "@/types/user";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Points", href: "/admin/points", icon: Coins },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Wallet", href: "/admin/wallet", icon: Wallet },
  { name: "Pricing Management", href: "/admin/pricing", icon: DollarSign },
  { name: "AI Config", href: "/admin/ai-config", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, checkSession } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-12 w-12 animate-spin text-[#0066ff]" />
          <p className="text-sm text-white/60">Loading admin panel...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !checkAdmin(user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-sm text-white/60 mt-1">
              You do not have permission to access the admin panel.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#0066ff]/25 transition-all"
          >
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Admin Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 z-40 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`flex items-center h-16 px-4 border-b border-white/5 ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-[#0066ff] to-[#00d4ff] bg-clip-text text-transparent whitespace-nowrap">
                {sidebarCollapsed ? "AD" : "ADMIN"}
              </span>
            </Link>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[#a0a0b0] hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapse Button (when collapsed) */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 mx-2 mt-2 rounded-lg hover:bg-white/5 text-[#a0a0b0] hover:text-white transition-colors flex justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-[#0066ff]/20 to-[#00d4ff]/20 text-white"
                      : "text-[#a0a0b0] hover:text-white hover:bg-white/5"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#0066ff] to-[#00d4ff] rounded-r-full"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#00d4ff]" : ""}`}
                  />
                  {!sidebarCollapsed && (
                    <span
                      className={`text-sm font-medium ${isActive ? "text-white" : ""}`}
                    >
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Badge */}
          {!sidebarCollapsed && (
            <div className="px-4 py-4 border-t border-white/5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20">
                <Shield className="w-4 h-4 text-[#0066ff]" />
                <span className="text-xs font-medium text-[#0066ff]">Administrator</span>
              </div>
            </div>
          )}

          {/* User Profile */}
          <div className="px-2 py-4 border-t border-white/5">
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-[#a0a0b0] truncate">Admin Panel</p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 mt-2 px-2">
                <Link
                  href="/dashboard"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-[#a0a0b0] hover:text-white hover:bg-white/5 transition-colors"
                >
                  Back to App
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <div className="min-h-screen p-6">{children}</div>
      </main>
    </div>
  );
}
