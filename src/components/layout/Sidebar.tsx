"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Type,
  Code2,
  Image,
  Music,
  Video,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Zap,
} from "lucide-react";
import { useQuotaStore, getRemainingDailyCredits } from "@/store/quotaStore";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Text AI", href: "/text-ai", icon: Type },
  { name: "Code AI", href: "/code-ai", icon: Code2 },
  { name: "Image AI", href: "/image-ai", icon: Image },
  { name: "Music AI", href: "/music-ai", icon: Music },
  { name: "Video AI", href: "/video-ai", icon: Video },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const { plan, dailyUsed, credits, points, videoUsage } = useQuotaStore();
  const remainingCredits = getRemainingDailyCredits({ credits, points, dailyUsed, videoUsage, plan, lastReset: null, videoReset: null, isLoading: false, error: null });

  const dailyQuota = plan === "FREE" ? 100 : plan === "PRO" ? 500 : 1000;
  const quotaPercentage = Math.min((dailyUsed / dailyQuota) * 100, 100);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 z-40 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-[#0066ff] to-[#00d4ff] bg-clip-text text-transparent whitespace-nowrap">
              {collapsed ? "DA" : "DUALAIHUB"}
            </span>
          </Link>
          {!collapsed && (
            <button
              onClick={() => onCollapsedChange?.(true)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#a0a0b0] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse Button (when collapsed) */}
        {collapsed && (
          <button
            onClick={() => onCollapsedChange?.(false)}
            className="p-2 mx-2 mt-2 rounded-lg hover:bg-white/5 text-[#a0a0b0] hover:text-white transition-colors flex justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-[#0066ff]/20 to-[#00d4ff]/20 text-white"
                    : "text-[#a0a0b0] hover:text-white hover:bg-white/5"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#0066ff] to-[#00d4ff] rounded-r-full"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#00d4ff]" : ""}`} />
                {!collapsed && (
                  <span className={`text-sm font-medium ${isActive ? "text-white" : ""}`}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quota Display */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#a0a0b0]">Daily Quota</span>
              <span className="text-xs text-white font-medium">{remainingCredits} left</span>
            </div>
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${quotaPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  quotaPercentage > 80
                    ? "bg-gradient-to-r from-red-500 to-red-400"
                    : quotaPercentage > 50
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                    : "bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
                }`}
              />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Zap className="w-3 h-3 text-[#00d4ff]" />
              <span className="text-xs text-[#a0a0b0]">
                {credits.toLocaleString()} total credits
              </span>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="px-2 py-4 border-t border-white/5">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-[#a0a0b0] truncate">{user?.plan || "FREE"}</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center gap-2 mt-2 px-2">
              <Link
                href="/profile"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-[#a0a0b0] hover:text-white hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
