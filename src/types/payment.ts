import type { Decimal } from '@prisma/client/runtime/library';

export type PaymentProvider = 'stripe' | 'paypal' | 'usdt';

export type PaymentCurrency = 'USD' | 'EUR' | 'USDT';

export type TransactionType = 'SUBSCRIPTION' | 'ONE_TIME' | 'USDT' | 'REFUND';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PlanType = 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: PaymentCurrency;
  status: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: PaymentCurrency;
  planId?: string;
  credits?: number;
}

export interface CreatePaypalOrderRequest {
  amount: number;
  currency?: PaymentCurrency;
  planId?: string;
  credits?: number;
}

export interface PaymentSession {
  id: string;
  url: string;
  provider: PaymentProvider;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: PaymentCurrency;
  status: TransactionStatus;
  paymentMethod?: string;
  externalId?: string;
  planId?: string;
  creditsGranted?: number;
  description?: string;
  createdAt: Date;
}

export interface TransactionWithUser extends Transaction {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export interface RefundRequest {
  transactionId: string;
  reason?: string;
}

export interface RefundResponse {
  id: string;
  amount: number;
  status: TransactionStatus;
  reason?: string;
}

export interface SubscriptionInfo {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  plan: PlanType;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  provider: PaymentProvider;
}

export interface PlanPricing {
  plan: PlanType;
  name: string;
  price: number;
  interval: 'month' | 'year';
  credits: number;
  features: string[];
  stripePriceId?: string;
  paypalPriceId?: string;
}

export interface CreditPurchase {
  credits: number;
  price: number;
  bonus?: number;
  provider: PaymentProvider;
}

// Points purchase package type
export interface PointsPackageType {
  id: string;
  points: number;
  price: number;
  bonus?: number;
  provider: PaymentProvider;
}

// Monthly points grant tracking
export interface MonthlyPointsGrant {
  id: string;
  userId: string;
  plan: PlanType;
  pointsGranted: number;
  grantedAt: Date;
  expiresAt: Date;
}

// Short drama quota tracking
export interface ShortDramaQuota {
  plan: PlanType;
  quota: number | null; // null means unlimited
  used: number;
  resetAt: Date;
}

export interface USDTPaymentDetails {
  address: string;
  amount: number;
  network: 'TRC20' | 'ERC20';
  memo?: string;
  qrCodeUrl?: string;
}

export interface USDTPaymentRequest {
  amount: number;
  credits: number;
}

export interface USDTPaymentVerification {
  isValid: boolean;
  transactionHash?: string;
  amount?: number;
  fromAddress?: string;
  error?: string;
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedAmount: number;
  revenueByPlan: Record<PlanType, number>;
  revenueByProvider: Record<PaymentProvider, number>;
}

export const PLAN_PRICING: PlanPricing[] = [
  {
    plan: 'FREE',
    name: 'Free',
    price: 0,
    interval: 'month',
    credits: 50,
    features: [
      '50 credits per day',
      '5 points/day trial',
      'Basic text AI',
      'Basic image AI',
      'No video generation',
      'No short drama access',
      'Community support',
    ],
  },
  {
    plan: 'BASIC',
    name: 'Basic',
    price: 7.99,
    interval: 'month',
    credits: 300,
    features: [
      '300 points per month',
      '3 short dramas per month',
      'All AI models',
      'Priority support',
      'No watermarks',
    ],
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    paypalPriceId: process.env.PAYPAL_BASIC_PRICE_ID,
  },
  {
    plan: 'PRO',
    name: 'Pro',
    price: 19.99,
    interval: 'month',
    credits: 1200,
    features: [
      '1200 points per month',
      '30 short dramas per month',
      'GPT-4o access',
      'Midjourney access',
      'Priority support',
      'Advanced features',
      'No watermarks',
      'API access',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    paypalPriceId: process.env.PAYPAL_PRO_PRICE_ID,
  },
  {
    plan: 'BUSINESS',
    name: 'Business',
    price: 49.99,
    interval: 'month',
    credits: 4000,
    features: [
      '4000 points per month',
      'Unlimited short dramas',
      'All AI models',
      '24/7 dedicated support',
      'All features',
      'No watermarks',
      'Full API access',
      'Team management',
      'SLA guarantee',
    ],
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    paypalPriceId: process.env.PAYPAL_BUSINESS_PRICE_ID,
  },
];

export const CREDIT_PACKAGES: CreditPurchase[] = [
  { credits: 100, price: 0.99, provider: 'stripe' },
  { credits: 500, price: 4.49, bonus: 25, provider: 'stripe' },
  { credits: 1000, price: 8.99, bonus: 100, provider: 'stripe' },
  { credits: 5000, price: 39.99, bonus: 750, provider: 'stripe' },
  { credits: 10000, price: 74.99, bonus: 2000, provider: 'stripe' },
];

export function getPlanFromPriceId(priceId: string): PlanType | null {
  const plan = PLAN_PRICING.find((p) => p.stripePriceId === priceId || p.paypalPriceId === priceId);
  return plan?.plan ?? null;
}

export function calculateCreditsWithBonus(credits: number): number {
  if (credits >= 10000) return credits + 2000;
  if (credits >= 5000) return credits + 750;
  if (credits >= 1000) return credits + 100;
  if (credits >= 500) return credits + 25;
  return credits;
}

// Get monthly points allocation for each plan
export function getMonthlyPoints(plan: PlanType): number {
  switch (plan) {
    case 'FREE':
      return 0; // FREE users get daily trial points instead
    case 'BASIC':
      return 300;
    case 'PRO':
      return 1200;
    case 'BUSINESS':
      return 4000;
    default:
      return 0;
  }
}

// Get short drama quota for each plan (null = unlimited)
export function getShortDramaQuota(plan: PlanType): number | null {
  switch (plan) {
    case 'FREE':
      return 0; // No short drama access
    case 'BASIC':
      return 3;
    case 'PRO':
      return 30;
    case 'BUSINESS':
      return null; // Unlimited
    default:
      return 0;
  }
}

// Get daily trial points for FREE users
export function getDailyTrialPoints(plan: PlanType): number {
  return plan === 'FREE' ? 5 : 0;
}
