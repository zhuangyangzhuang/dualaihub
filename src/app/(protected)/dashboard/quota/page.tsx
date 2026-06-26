"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  TrendingUp,
  Zap,
  CreditCard,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuotaStore } from "@/store/quotaStore";
import { useAuthStore } from "@/store/authStore";

interface UsageData {
  day: string;
  credits: number;
}

const mockUsageData: UsageData[] = [
  { day: "Mon", credits: 45 },
  { day: "Tue", credits: 72 },
  { day: "Wed", credits: 38 },
  { day: "Thu", credits: 95 },
  { day: "Fri", credits: 62 },
  { day: "Sat", credits: 28 },
  { day: "Sun", credits: 15 },
];

const creditPackages = [
  { id: "starter", name: "Starter", credits: 500, price: 9.99, perCredit: 0.02 },
  { id: "standard", name: "Standard", credits: 1500, price: 24.99, perCredit: 0.017, popular: true },
  { id: "pro", name: "Pro", credits: 5000, price: 69.99, perCredit: 0.014 },
  { id: "enterprise", name: "Enterprise", credits: 20000, price: 199.99, perCredit: 0.01 },
];

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    credits: 50,
    popular: false,
    features: ["50 credits/day", "Basic text AI", "Basic image AI", "No video generation", "Community support"],
  },
  {
    id: "BASIC",
    name: "Basic",
    price: 7.99,
    credits: 500,
    popular: false,
    features: ["500 credits/day", "All AI models", "3 videos/month", "Priority support", "No watermarks"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 19.99,
    credits: 2000,
    popular: true,
    features: ["2,000 credits/day", "GPT-4o access", "Midjourney access", "30 videos/month", "Priority support", "No watermarks", "API access"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: 49.99,
    credits: 999999,
    popular: false,
    features: ["Unlimited credits", "All AI models", "Unlimited videos", "24/7 dedicated support", "No watermarks", "Full API access", "SLA guarantee"],
  },
];

export default function QuotaPage() {
  const { user } = useAuthStore();
  const { credits, dailyUsed, plan, checkQuota, isLoading } = useQuotaStore();
  const [mounted, setMounted] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkQuota();
  }, [checkQuota]);

  const dailyQuota = plan === "FREE" ? 50 : plan === "BASIC" ? 500 : plan === "PRO" ? 2000 : 999999;
  const usagePercentage = mounted ? Math.round((dailyUsed / dailyQuota) * 100) : 0;
  const remainingDaily = Math.max(0, dailyQuota - (mounted ? dailyUsed : 0));
  const maxUsage = Math.max(...mockUsageData.map((d) => d.credits));

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsPurchasing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsPurchasing(false);
    setPurchaseSuccess(true);
    setTimeout(() => {
      setPurchaseSuccess(false);
      setSelectedPackage(null);
    }, 3000);
  };

  const currentPlanData = plans.find((p) => p.id === plan) || plans[0];
  const maxUsagePercentage = mounted ? Math.round((dailyUsed / maxUsage) * 100) : 0;

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Credits & Quota</h1>
            <p className="text-sm text-white/60">Manage your credits and subscription</p>
          </div>
        </div>
      </motion.div>

      {/* Current Quota Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 grid gap-4 md:grid-cols-3"
      >
        {/* Total Credits */}
        <Card className="bg-gradient-to-br from-[#0066ff]/10 to-[#00d4ff]/10 border-[#0066ff]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Credits</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    credits.toLocaleString()
                  )}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
                <Coins className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Available for use</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((credits / 10000) * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Usage */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Daily Usage</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    dailyUsed.toLocaleString()
                  )}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Daily quota: {dailyQuota}</span>
                <span>{usagePercentage}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercentage}%` }}
                  className={cn(
                    "h-full rounded-full",
                    usagePercentage > 80
                      ? "bg-gradient-to-r from-red-500 to-red-400"
                      : usagePercentage > 50
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset Time */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Resets In</p>
                <p className="mt-1 text-3xl font-bold text-white">8h 24m</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-xs text-white/50">
                {remainingDaily} credits remaining today
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-[#00d4ff]" />
              Weekly Usage
            </CardTitle>
            <CardDescription className="text-white/60">
              Your credit consumption over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40">
              {mockUsageData.map((data, index) => (
                <motion.div
                  key={data.day}
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                  className="flex flex-col items-center gap-2 w-full"
                >
                  <div className="relative w-full flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.credits / maxUsage) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                      className={cn(
                        "w-full rounded-t-lg",
                        data.day === "Thu"
                          ? "bg-gradient-to-t from-[#0066ff] to-[#00d4ff]"
                          : "bg-gradient-to-t from-white/20 to-white/10"
                      )}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/50">
                      {data.credits}
                    </span>
                  </div>
                  <span className="text-xs text-white/50">{data.day}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Buy Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0066ff]" />
                Buy Credits
              </CardTitle>
              <CardDescription className="text-white/60">
                One-time credit pack purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {creditPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isPurchasing}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-all",
                    pkg.popular
                      ? "border-[#0066ff] bg-[#0066ff]/10"
                      : "border-white/10 bg-white/5 hover:border-white/20",
                    selectedPackage === pkg.id && "ring-2 ring-[#0066ff]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          pkg.popular
                            ? "bg-gradient-to-br from-[#0066ff] to-[#00d4ff]"
                            : "bg-white/10"
                        )}
                      >
                        <Coins className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {pkg.name}
                          </span>
                          {pkg.popular && (
                            <Badge className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/50">
                          {pkg.credits.toLocaleString()} credits
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        ${pkg.price}
                      </p>
                      <p className="text-xs text-white/40">
                        ${pkg.perCredit.toFixed(3)}/credit
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {purchaseSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Purchase successful! Credits added to your account.
                  </span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upgrade Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-[#00d4ff]" />
                Upgrade Plan
              </CardTitle>
              <CardDescription className="text-white/60">
                Get more credits with a subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-xl border p-4",
                    p.id === plan
                      ? "border-[#0066ff] bg-[#0066ff]/10"
                      : "border-white/10 bg-white/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          p.id === plan
                            ? "bg-gradient-to-br from-[#0066ff] to-[#00d4ff]"
                            : "bg-white/10"
                        )}
                      >
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {p.name}
                          </span>
                          {p.id === plan && (
                            <Badge className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/50">
                          {p.credits.toLocaleString()} credits/day
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {p.price === 0 ? "Free" : `$${p.price}`}
                      </p>
                      {p.price > 0 && (
                        <p className="text-xs text-white/40">/month</p>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {p.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs text-white/60"
                      >
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {p.id !== plan && (
                    <Button
                      className="w-full"
                      variant={p.popular ? "default" : "outline"}
                      onClick={() => handlePurchase(`upgrade-${p.id}`)}
                      disabled={isPurchasing || p.id === "BUSINESS"}
                    >
                      {p.price === 0 ? (
                        "Downgrade"
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Upgrade
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
