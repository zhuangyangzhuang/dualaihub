import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserPlan, UserCreditsInfo } from '@/types/user';
import { PLAN_PRICING } from '@/types/payment';

interface QuotaState {
  credits: number;
  points: number;
  dailyUsed: number;
  videoUsage: number;
  plan: UserPlan;
  lastReset: Date | null;
  videoReset: Date | null;
  isLoading: boolean;
  error: string | null;
}

interface QuotaActions {
  checkQuota: () => Promise<UserCreditsInfo | null>;
  useCredits: (amount: number) => Promise<boolean>;
  resetDaily: () => void;
  setCredits: (credits: number) => void;
  setPlan: (plan: UserPlan) => void;
  syncFromServer: (creditsInfo: UserCreditsInfo) => void;
}

type QuotaStore = QuotaState & QuotaActions;

const getDailyQuota = (plan: UserPlan): number => {
  const planPricing = PLAN_PRICING.find((p) => p.plan === plan);
  return planPricing?.credits ?? 100;
};

const shouldResetDaily = (lastReset: Date | null): boolean => {
  if (!lastReset) return true;
  const now = new Date();
  const resetTime = new Date(lastReset);
  resetTime.setHours(0, 0, 0, 0);
  const tomorrow = new Date(resetTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return now >= tomorrow;
};

export const useQuotaStore = create<QuotaStore>()(
  persist(
    (set, get) => ({
      credits: 0,
      points: 0,
      dailyUsed: 0,
      videoUsage: 0,
      plan: 'FREE',
      lastReset: null,
      videoReset: null,
      isLoading: false,
      error: null,

      checkQuota: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/quota');
          if (!response.ok) {
            throw new Error('Failed to fetch quota');
          }
          const data = await response.json();

          set({
            credits: data.credits,
            points: data.points ?? 0,
            dailyUsed: data.dailyUsed ?? 0,
            videoUsage: data.videoUsage ?? 0,
            plan: data.plan ?? 'FREE',
            lastReset: data.lastReset ? new Date(data.lastReset) : null,
            videoReset: data.videoReset ? new Date(data.videoReset) : null,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to check quota',
            isLoading: false,
          });
          return null;
        }
      },

      useCredits: async (amount: number) => {
        const { credits, dailyUsed, plan, lastReset, checkQuota } = get();

        if (shouldResetDaily(lastReset)) {
          set({ dailyUsed: 0, lastReset: new Date() });
        }

        const currentDailyUsed = shouldResetDaily(lastReset) ? 0 : dailyUsed;
        const dailyQuota = getDailyQuota(plan);

        if (currentDailyUsed + amount > dailyQuota) {
          return false;
        }

        if (credits < amount) {
          return false;
        }

        try {
          const response = await fetch('/api/credits/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
          });

          if (!response.ok) {
            throw new Error('Failed to use credits');
          }

          set({
            credits: credits - amount,
            dailyUsed: currentDailyUsed + amount,
          });

          return true;
        } catch {
          return false;
        }
      },

      resetDaily: () => {
        set({ dailyUsed: 0, lastReset: new Date() });
      },

      setCredits: (credits) => {
        set({ credits });
      },

      setPlan: (plan) => {
        set({ plan });
      },

      syncFromServer: (creditsInfo) => {
        set({
          credits: creditsInfo.total,
          dailyUsed: creditsInfo.dailyUsed,
          lastReset: new Date(creditsInfo.lastReset),
        });
      },
    }),
    {
      name: 'quota-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        credits: state.credits,
        points: state.points,
        dailyUsed: state.dailyUsed,
        videoUsage: state.videoUsage,
        plan: state.plan,
        lastReset: state.lastReset,
        videoReset: state.videoReset,
      }),
    }
  )
);

export const getRemainingDailyCredits = (state: QuotaState): number => {
  const dailyQuota = getDailyQuota(state.plan);
  return Math.max(0, dailyQuota - state.dailyUsed);
};

export const canUseCredits = (state: QuotaState, amount: number): boolean => {
  if (shouldResetDaily(state.lastReset)) {
    return amount <= getDailyQuota(state.plan);
  }
  return state.credits >= amount && state.dailyUsed + amount <= getDailyQuota(state.plan);
};
