"use client";

import React, { ReactNode, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  ArrowUpCircle,
  Zap,
  Video,
  Music,
  Image,
  Code,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Crown,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Gift,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuotaStore } from "@/store/quotaStore";

// =====================================================
// Types & Interfaces
// =====================================================

export type ServiceType = 'text' | 'code' | 'image' | 'video' | 'music' | 'short_drama';

interface QuotaGuardProps {
  children: ReactNode;
  modelId: string;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  fallback?: ReactNode;
  onProceed?: () => void;
  onUpgradeClick?: () => void;
  className?: string;
  showConfirmation?: boolean;
  autoCheck?: boolean;
}

// Billing check response types
interface BillingCheckResponse {
  canProceed: boolean;
  model?: {
    id: string;
    name: string;
    serviceType: string;
    tier: string;
    provider: string;
  };
  user?: {
    plan: string;
    planName: string;
  };
  balance?: {
    totalPoints: number;
    permanentPoints: number;
    monthlyPoints: number;
    dailyTrialPoints: number;
    dailyTrialUsed: number;
    dailyTrialRemaining: number;
  };
  cost?: {
    requiredPoints: number;
    estimatedInputTokens?: number;
    estimatedOutputTokens?: number;
  };
  usage?: {
    willUseQuota: boolean;
    willUsePoints: boolean;
    willUseTrial: boolean;
    deductedFrom: 'quota' | 'trial' | 'points' | 'none';
  };
  shortDrama?: {
    quota: number;
    used: number;
    remaining: number;
    canUseQuota: boolean;
  };
  error?: string;
  errorType?: string;
  insufficientBalance?: {
    required: number;
    available: number;
    shortage: number;
  };
  serviceNotAllowed?: {
    currentPlan: string;
    serviceType: string;
  };
  suggestions?: Array<{
    type: string;
    message: string;
    urgency: string;
  }>;
}

interface CheckState {
  isLoading: boolean;
  isChecked: boolean;
  canProceed: boolean;
  data: BillingCheckResponse | null;
  error: string | null;
}

// =====================================================
// Constants
// =====================================================

const SERVICE_INFO: Record<ServiceType, { icon: React.ElementType; name: string; nameCn: string; color: string }> = {
  text: { icon: MessageSquare, name: "Text Generation", nameCn: "文字生成", color: "#3b82f6" },
  code: { icon: Code, name: "Code Generation", nameCn: "代码生成", color: "#10b981" },
  image: { icon: Image, name: "Image Generation", nameCn: "图片生成", color: "#f59e0b" },
  video: { icon: Video, name: "Video Generation", nameCn: "视频生成", color: "#ef4444" },
  music: { icon: Music, name: "Music Generation", nameCn: "音乐生成", color: "#8b5cf6" },
  short_drama: { icon: PlayCircle, name: "AI Short Drama", nameCn: "AI短剧", color: "#ec4899" },
};

const PLAN_INFO: Record<string, { name: string; color: string; icon: React.ElementType }> = {
  FREE: { name: "免费版", color: "#6b7280", icon: Gift },
  BASIC: { name: "基础版", color: "#3b82f6", icon: Zap },
  PRO: { name: "专业版", color: "#8b5cf6", icon: Crown },
  BUSINESS: { name: "商业版", color: "#f59e0b", icon: TrendingUp },
};

// =====================================================
// Main Component
// =====================================================

export function QuotaGuard({
  children,
  modelId,
  estimatedInputTokens,
  estimatedOutputTokens,
  fallback,
  onProceed,
  onUpgradeClick,
  className,
  showConfirmation = true,
  autoCheck = true,
}: QuotaGuardProps) {
  const { plan } = useQuotaStore();
  const [checkState, setCheckState] = useState<CheckState>({
    isLoading: false,
    isChecked: false,
    canProceed: false,
    data: null,
    error: null,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Billing check function
  const performBillingCheck = useCallback(async () => {
    setCheckState({ isLoading: true, isChecked: false, canProceed: false, data: null, error: null });

    try {
      const response = await fetch("/api/billing/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          estimatedInputTokens,
          estimatedOutputTokens,
        }),
      });

      const data: BillingCheckResponse = await response.json();

      setCheckState({
        isLoading: false,
        isChecked: true,
        canProceed: data.canProceed,
        data,
        error: data.error || null,
      });

      // If can proceed and no confirmation needed, auto proceed
      if (data.canProceed && !showConfirmation && !data.usage?.willUsePoints) {
        onProceed?.();
      }
      // If will use points, show confirmation dialog
      else if (data.canProceed && data.usage?.willUsePoints && showConfirmation) {
        setShowConfirmDialog(true);
      }
    } catch (err) {
      setCheckState({
        isLoading: false,
        isChecked: true,
        canProceed: false,
        data: null,
        error: err instanceof Error ? err.message : "检查失败",
      });
    }
  }, [modelId, estimatedInputTokens, estimatedOutputTokens, showConfirmation, onProceed]);

  // Auto check on mount
  useEffect(() => {
    if (autoCheck) {
      performBillingCheck();
    }
  }, [autoCheck, performBillingCheck]);

  // Handle proceed
  const handleProceed = () => {
    setShowConfirmDialog(false);
    onProceed?.();
  };

  // Handle upgrade
  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setShowUpgradeDialog(true);
    }
  };

  // Loading state
  if (checkState.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("rounded-xl border border-white/10 bg-white/5 p-6", className)}
      >
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#00d4ff]" />
          <span className="text-sm text-white/70">正在检查您的账户余额...</span>
        </div>
      </motion.div>
    );
  }

  // Fallback if provided and not checked yet
  if (!checkState.isChecked && fallback) {
    return <>{fallback}</>;
  }

  // Success - can proceed (children or confirmation dialog)
  if (checkState.canProceed && checkState.data) {
    return (
      <>
        {showConfirmDialog ? (
          <PointsConfirmDialog
            data={checkState.data}
            onConfirm={handleProceed}
            onCancel={() => setShowConfirmDialog(false)}
          />
        ) : (
          <>{children}</>
        )}
      </>
    );
  }

  // Cannot proceed - show blocking UI
  if (!checkState.canProceed && checkState.data) {
    return (
      <>
        <BlockedUI
          data={checkState.data}
          onUpgradeClick={handleUpgradeClick}
          onRetry={performBillingCheck}
          className={className}
        />
        
        <AnimatePresence>
          {showUpgradeDialog && (
            <UpgradeDialog
              currentPlan={checkState.data.user?.plan || plan}
              onClose={() => setShowUpgradeDialog(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Error state
  if (checkState.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-xl border border-red-500/20 bg-red-500/5 p-4", className)}
      >
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-white">{checkState.error}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={performBillingCheck}
          className="mt-3"
        >
          重新检查
        </Button>
      </motion.div>
    );
  }

  return <>{children}</>;
}

// =====================================================
// Points Confirmation Dialog
// =====================================================

interface PointsConfirmDialogProps {
  data: BillingCheckResponse;
  onConfirm: () => void;
  onCancel: () => void;
}

function PointsConfirmDialog({ data, onConfirm, onCancel }: PointsConfirmDialogProps) {
  const requiredPoints = data.cost?.requiredPoints || 0;
  const balance = data.balance;
  const usage = data.usage;
  const shortDrama = data.shortDrama;
  const userPlan = data.user?.plan || "FREE";

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-[#00d4ff]" />
            确认使用积分
          </DialogTitle>
          <DialogDescription className="text-white/60">
            此操作将消耗您的积分余额
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cost Display */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="rounded-xl border border-[#00d4ff]/20 bg-gradient-to-r from-[#00d4ff]/10 to-transparent p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00d4ff]" />
                <span className="text-sm text-white/70">本次消耗</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-white">{requiredPoints}</span>
                <span className="text-sm text-white/50">积分</span>
              </div>
            </div>
          </motion.div>

          {/* Usage Breakdown */}
          {usage && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-white/50 uppercase">扣费明细</h4>
              <div className="space-y-2">
                {usage.willUseQuota && shortDrama?.remaining !== undefined && shortDrama.remaining > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg bg-green-500/10 border border-green-500/20 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-white">会员短剧配额</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                      免费
                    </Badge>
                  </motion.div>
                )}
                
                {usage.willUseTrial && balance?.dailyTrialRemaining !== undefined && balance.dailyTrialRemaining > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-white">免费试用额度</span>
                    </div>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                      免费
                    </Badge>
                  </motion.div>
                )}

                {usage.willUsePoints && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: usage.willUseQuota || usage.willUseTrial ? 0.2 : 0 }}
                    className="flex items-center justify-between rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-[#00d4ff]" />
                      <span className="text-sm text-white">积分余额</span>
                    </div>
                    <Badge className="bg-[#00d4ff]/20 text-[#00d4ff]">
                      -{requiredPoints} 积分
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Balance Summary */}
          {balance && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">当前总积分</span>
                <span className="font-medium text-white">{balance.totalPoints}</span>
              </div>
              {userPlan === "FREE" && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-white/40">今日试用剩余</span>
                  <span className="text-amber-400">{balance.dailyTrialRemaining}/{balance.dailyTrialPoints}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-[#00d4ff] to-[#0066ff] hover:opacity-90"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            确认使用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// Blocked UI Component
// =====================================================

interface BlockedUIProps {
  data: BillingCheckResponse;
  onUpgradeClick: () => void;
  onRetry: () => void;
  className?: string;
}

function BlockedUI({ data, onUpgradeClick, onRetry, className }: BlockedUIProps) {
  const errorType = data.errorType;
  const userPlan = data.user?.plan || "FREE";
  const planInfo = PLAN_INFO[userPlan] || PLAN_INFO.FREE;
  const balance = data.balance;
  const shortDrama = data.shortDrama;
  const insufficient = data.insufficientBalance;
  const serviceNotAllowed = data.serviceNotAllowed;

  // Insufficient Balance
  if (errorType === "insufficient_balance" && insufficient) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-5", className)}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">积分不足</h3>
            <p className="text-sm text-white/50">需要充值以继续使用此功能</p>
          </div>
        </div>

        {/* Balance Comparison */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40">需要积分</p>
              <p className="text-2xl font-bold text-red-400">{insufficient.required}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">可用积分</p>
              <p className="text-2xl font-bold text-white">{insufficient.available}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/40">缺口</span>
              <span className="text-red-400">-{insufficient.shortage} 积分</span>
            </div>
            <Progress value={(insufficient.available / insufficient.required) * 100} className="h-2 bg-white/10" />
          </div>
        </motion.div>

        {/* Balance Details */}
        {balance && (
          <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/50">总积分余额</span>
              <span className="font-medium text-white">{balance.totalPoints}</span>
            </div>
            {balance.monthlyPoints > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-white/40">月度积分</span>
                <span className="text-[#00d4ff]">{balance.monthlyPoints}</span>
              </div>
            )}
            {balance.permanentPoints > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-white/40">永久积分</span>
                <span className="text-green-400">{balance.permanentPoints}</span>
              </div>
            )}
          </div>
        )}

        {/* Member Quota */}
        {shortDrama && shortDrama.remaining > 0 && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-green-500" />
              <span className="text-sm text-white/70">会员短剧配额剩余</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {shortDrama.remaining}/{shortDrama.quota}
              </Badge>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-[#00d4ff] to-[#0066ff]"
          >
            <a href="/dashboard/points">
              <CreditCard className="mr-2 h-4 w-4" />
              快速充值
            </a>
          </Button>
          {userPlan === "FREE" && (
            <Button
              variant="outline"
              onClick={onUpgradeClick}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              升级会员
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Service Not Allowed (FREE user blocked)
  if (errorType === "service_not_allowed" && serviceNotAllowed) {
    const serviceTypeDisplay: Record<string, { name: string; icon: React.ElementType }> = {
      TEXT_HIGH_END: { name: "高端文本AI", icon: MessageSquare },
      IMAGE_HIGH_END: { name: "高端图像生成", icon: Image },
      VIDEO_BASIC: { name: "视频生成", icon: Video },
      VIDEO_HD: { name: "高清视频", icon: Video },
      SHORT_DRAMA_BASIC: { name: "AI短剧", icon: PlayCircle },
      SHORT_DRAMA_HD: { name: "高清AI短剧", icon: PlayCircle },
    };
    
    const blockedService = serviceTypeDisplay[serviceNotAllowed.serviceType] || { name: "此服务", icon: XCircle };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-5", className)}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <blockedService.icon className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">功能受限</h3>
            <p className="text-sm text-white/50">升级会员以解锁此功能</p>
          </div>
        </div>

        {/* Blocked Message */}
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-white">
                {planInfo.name}用户无法使用 <span className="text-amber-400">{blockedService.name}</span>
              </p>
              <p className="text-xs text-white/50 mt-1">
                请升级到更高级别的会员套餐以解锁此功能
              </p>
            </div>
          </div>
        </div>

        {/* Available Services */}
        {balance && (
          <div className="mb-4 space-y-2">
            <h4 className="text-xs font-medium text-white/50 uppercase">当前套餐可用服务</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="text-xs text-white/70">基础文本</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                <Image className="h-4 w-4 text-green-500" />
                <span className="text-xs text-white/70">基础图像</span>
              </div>
              {userPlan !== "FREE" && (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-white/70">高端文本</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-2">
                    <Video className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-white/70">视频生成</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        <Button
          onClick={onUpgradeClick}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          升级以解锁此功能
        </Button>
      </motion.div>
    );
  }

  // Generic Error
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border border-red-500/20 bg-red-500/5 p-4", className)}
    >
      <div className="flex items-center gap-3 mb-3">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="text-sm text-white">{data.error || "无法执行此操作"}</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onRetry}>
          重新检查
        </Button>
        <Button size="sm" onClick={onUpgradeClick}>
          升级会员
        </Button>
      </div>
    </motion.div>
  );
}

// =====================================================
// Upgrade Dialog
// =====================================================

interface UpgradeDialogProps {
  currentPlan: string;
  onClose: () => void;
}

const UPGRADE_OPTIONS = [
  {
    plan: "BASIC",
    name: "基础版",
    price: 7.99,
    priceLabel: "$7.99/月",
    points: 300,
    shortDrama: 10,
    features: ["高端文本AI", "每月300积分", "10次短剧配额", "视频生成"],
    highlight: false,
  },
  {
    plan: "PRO",
    name: "专业版",
    price: 19.99,
    priceLabel: "$19.99/月",
    points: 1200,
    shortDrama: 30,
    features: ["所有高端模型", "每月1200积分", "30次短剧配额", "高清视频", "优先支持"],
    highlight: true,
  },
  {
    plan: "BUSINESS",
    name: "商业版",
    price: 49.99,
    priceLabel: "$49.99/月",
    points: 4000,
    shortDrama: 100,
    features: ["无限所有功能", "每月4000积分", "100次短剧配额", "专属支持", "完整API"],
    highlight: false,
  },
];

function UpgradeDialog({ currentPlan, onClose }: UpgradeDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            升级会员套餐
          </DialogTitle>
          <DialogDescription className="text-white/60">
            解锁更多功能，获得更多积分和配额
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Current Plan */}
          <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">当前套餐</span>
              <Badge className="bg-white/10 text-white">{PLAN_INFO[currentPlan]?.name || currentPlan}</Badge>
            </div>
          </div>

          {/* Upgrade Options */}
          <div className="grid gap-3">
            {UPGRADE_OPTIONS.map((option) => (
              <motion.a
                key={option.plan}
                href="/dashboard/settings?tab=subscription"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative rounded-xl border p-4 transition-all",
                  option.highlight
                    ? "border-[#0066ff]/50 bg-gradient-to-r from-[#0066ff]/10 to-transparent"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
              >
                {option.highlight && (
                  <div className="absolute -top-2 right-4">
                    <Badge className="bg-[#0066ff] text-white">推荐</Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      option.highlight ? "bg-[#0066ff]/20" : "bg-white/10"
                    )}>
                      <Crown className={cn(
                        "h-5 w-5",
                        option.highlight ? "text-[#0066ff]" : "text-white/50"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{option.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {option.points} 积分/月
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-pink-500/20 text-pink-400">
                          {option.shortDrama} 短剧配额
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{option.priceLabel}</p>
                    <p className="text-xs text-white/40">{option.features[0]}</p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {option.features.slice(1).map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs text-white/50 border-white/10">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </motion.a>
            ))}
          </div>

          {/* Points Purchase */}
          <div className="mt-4 rounded-lg border border-[#00d4ff]/20 bg-[#00d4ff]/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[#00d4ff]" />
                <span className="text-sm text-white">积分充值</span>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[#00d4ff]/30 text-[#00d4ff]"
              >
                <a href="/dashboard/points">
                  购买积分
                </a>
              </Button>
            </div>
            <p className="mt-2 text-xs text-white/50">
              按需付费，积分永久有效，支持所有服务类型
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// Export HOC
// =====================================================

export function withQuotaGuard<P extends object>(
  Component: React.ComponentType<P>,
  modelId: string,
  options?: { estimatedTokens?: number; showConfirmation?: boolean }
) {
  return function QuotaGuardComponent(props: P) {
    return (
      <QuotaGuard
        modelId={modelId}
        estimatedInputTokens={options?.estimatedTokens}
        showConfirmation={options?.showConfirmation ?? true}
      >
        <Component {...props} />
      </QuotaGuard>
    );
  };
}

// =====================================================
// Utility Hook for Billing Check
// =====================================================

export function useBillingCheck(modelId: string) {
  const [state, setState] = useState<CheckState>({
    isLoading: false,
    isChecked: false,
    canProceed: false,
    data: null,
    error: null,
  });

  const check = useCallback(async (inputTokens?: number, outputTokens?: number) => {
    setState({ isLoading: true, isChecked: false, canProceed: false, data: null, error: null });

    try {
      const response = await fetch("/api/billing/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          estimatedInputTokens: inputTokens,
          estimatedOutputTokens: outputTokens,
        }),
      });

      const data: BillingCheckResponse = await response.json();

      setState({
        isLoading: false,
        isChecked: true,
        canProceed: data.canProceed,
        data,
        error: data.error || null,
      });

      return data;
    } catch (err) {
      setState({
        isLoading: false,
        isChecked: true,
        canProceed: false,
        data: null,
        error: err instanceof Error ? err.message : "检查失败",
      });
      return null;
    }
  }, [modelId]);

  return { ...state, check };
}