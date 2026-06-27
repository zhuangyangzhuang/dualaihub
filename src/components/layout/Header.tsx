"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const user = session?.user;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#0066ff] to-[#00d4ff] bg-clip-text text-transparent">
              DUALAIHUB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-[#a0a0b0] hover:text-white transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#a0a0b0]" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-[#12121a] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-medium text-white">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-[#a0a0b0]">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#a0a0b0] hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#a0a0b0] hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <Link
                          href="/billing"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#a0a0b0] hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          Billing
                        </Link>
                      </div>
                      <div className="border-t border-white/5 py-1">
                        <button
                          onClick={() => {
                            signOut({ callbackUrl: "/" });
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#a0a0b0] hover:text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0f] border-t border-white/5"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base text-[#a0a0b0] hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/5 space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-base text-[#a0a0b0] hover:text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: "/" });
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left text-base text-red-400 hover:text-red-300 transition-colors"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
