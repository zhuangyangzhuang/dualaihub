"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Sparkles, History, Gauge, User } from "lucide-react";

const navTabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "AI Tools", href: "/ai-tools", icon: Sparkles },
  { name: "History", href: "/history", icon: History },
  { name: "Quota", href: "/quota", icon: Gauge },
  { name: "Profile", href: "/profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navTabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 relative py-2 px-3 rounded-lg transition-colors duration-200 ${
                isActive ? "text-white" : "text-[#a0a0b0]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute inset-0 bg-gradient-to-r from-[#0066ff]/10 to-[#00d4ff]/10 rounded-lg"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-[#00d4ff]" : ""}`} />
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-[#0066ff] to-[#00d4ff] rounded-full"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-white" : ""}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
