"use client";

import { useCallback } from "react";
import { useQuotaStore } from "@/store/quotaStore";
import toast from "react-hot-toast";

const PLAN_CREDITS = {
  FREE: 50,
  BASIC: 500,
  PRO: 2000,
  BUSINESS: Infinity,
};

const SERVICE_COSTS = {
  text: 1,
  code: 2,
  image: 3,
  music: 5,
  video: 10,
};

export function useQuota() {
  const store = useQuotaStore();
  
  const {
    credits,
    dailyUsed,
    plan,
    lastReset,
    isLoading,
    error,
    checkQuota,
    resetDaily,
    setCredits,
    setPlan,
    syncFromServer,
  } = store;

  // Alias the action to avoid ESLint hook rule conflict (it's a store action, not a hook)
  const deductCredits = store.useCredits;

  const canUse = useCallback((serviceType: keyof typeof SERVICE_COSTS): boolean => {
    const cost = SERVICE_COSTS[serviceType];
    if (plan === "BUSINESS") return true;
    return credits >= cost;
  }, [credits, plan]);

  const useService = useCallback(async (serviceType: keyof typeof SERVICE_COSTS): Promise<boolean> => {
    const cost = SERVICE_COSTS[serviceType];
    if (!canUse(serviceType)) {
      toast.error("Insufficient credits. Please upgrade your plan or purchase more credits.");
      return false;
    }

    try {
      await deductCredits(cost);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to use credits");
      return false;
    }
  }, [canUse, deductCredits]);

  const getRemainingCredits = useCallback((): number => {
    if (plan === "BUSINESS") return Infinity;
    return Math.max(0, credits - dailyUsed);
  }, [credits, dailyUsed, plan]);

  const getUsagePercentage = useCallback((): number => {
    const maxCredits = PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS] || 50;
    if (plan === "BUSINESS") return 0;
    return Math.min(100, (dailyUsed / maxCredits) * 100);
  }, [dailyUsed, plan]);

  const isDailyResetNeeded = useCallback((): boolean => {
    if (!lastReset) return false;
    const resetTime = new Date(lastReset);
    const now = new Date();
    return now.getDate() !== resetTime.getDate();
  }, [lastReset]);

  const handleDailyReset = useCallback(async () => {
    if (isDailyResetNeeded()) {
      await resetDaily();
      toast.success("Daily credits have been reset!");
    }
  }, [isDailyResetNeeded, resetDaily]);

  return {
    credits,
    dailyUsed,
    plan,
    isLoading,
    error,
    canUse,
    useService,
    getRemainingCredits,
    getUsagePercentage,
    checkQuota,
    syncFromServer,
    handleDailyReset,
    PLAN_CREDITS,
    SERVICE_COSTS,
  };
}
