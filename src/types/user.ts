import type { Session } from 'next-auth';

export type UserRole = 'USER' | 'ADMIN';

export type UserPlan = 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS';

export type UserProvider = 'email' | 'google' | 'github' | 'discord';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  passwordHash?: string;
  role: UserRole;
  plan: UserPlan;
  emailVerified?: Date | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRelations extends User {
  accounts?: Account[];
  sessions?: UserSession[];
  credits?: Credit | null;
  transactions?: Transaction[];
  aiHistory?: AIHistory[];
}

export interface PublicUser {
  id: string;
  email?: string;
  name?: string | null;
  image?: string | null;
  role: UserRole;
  plan: UserPlan;
  createdAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface UserSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface Credit {
  id: string;
  userId: string;
  amount: number;
  dailyUsed: number;
  lastReset: Date;
  updatedAt: Date;
}

export interface AIHistory {
  id: string;
  userId: string;
  serviceType: string;
  model: string;
  prompt: string;
  result?: string;
  creditsUsed: number;
  status: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'SUBSCRIPTION' | 'ONE_TIME' | 'USDT' | 'REFUND';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  externalId?: string;
  planId?: string;
  creditsGranted?: number;
  description?: string;
  createdAt: Date;
}

export interface UserStats {
  totalCreditsUsed: number;
  totalRequests: number;
  totalSpent: number;
  memberSince: Date;
  lastActive?: Date;
  favoriteModel?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultModel?: string;
  notifications: {
    email: boolean;
    push: boolean;
    updates: boolean;
  };
  aiSettings: {
    temperature: number;
    maxTokens: number;
    streaming: boolean;
  };
}

export interface UpdateUserRequest {
  name?: string;
  image?: string;
  role?: UserRole;
  plan?: UserPlan;
  emailVerified?: Date | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  password?: string;
  role?: UserRole;
  plan?: UserPlan;
}

export interface UserCreditsInfo {
  total: number;
  daily: number;
  dailyUsed: number;
  lastReset: Date;
  resetIn?: number;
}

export interface UserSubscription {
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
  plan: UserPlan;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  provider?: UserProvider;
}

export function getCreditsResetTime(lastReset: Date): number {
  const now = new Date();
  const tomorrow = new Date(lastReset);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return Math.max(0, tomorrow.getTime() - now.getTime());
}

export function canUseCredits(creditsInfo: UserCreditsInfo): boolean {
  return creditsInfo.dailyUsed < creditsInfo.daily;
}

export function getRemainingCredits(creditsInfo: UserCreditsInfo): number {
  return Math.max(0, creditsInfo.daily - creditsInfo.dailyUsed);
}

export function getPlanFeatures(plan: UserPlan): string[] {
  const features: Record<UserPlan, string[]> = {
    FREE: [
      '50 credits per day',
      'Basic text AI',
      'Basic image AI',
      'No video generation',
      'Community support',
    ],
    BASIC: [
      '500 credits per day',
      'All AI models',
      '3 videos per month',
      'Priority support',
      'No watermarks',
    ],
    PRO: [
      '2000 credits per day',
      'GPT-4o access',
      'Midjourney access',
      '30 videos per month',
      'Priority support',
      'Advanced features',
      'API access',
    ],
    BUSINESS: [
      'Unlimited credits',
      'All AI models',
      'Unlimited videos',
      '24/7 dedicated support',
      'Full API access',
      'SLA guarantee',
    ],
  };
  return features[plan] || features.FREE;
}

export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    USER: 'User',
    ADMIN: 'Administrator',
  };
  return names[role];
}

export function isAdmin(user: User | PublicUser | { role: UserRole }): boolean {
  return user.role === 'ADMIN';
}
