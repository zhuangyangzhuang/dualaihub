"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  CreditCard,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  History,
  Image,
  Video,
  Gift,
  TrendingUp,
  AlertCircle,
  Calendar,
  Download,
  Film,
  MessageSquare,
  Zap,
  Crown,
  DollarSign,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import {
  POINTS_PACKAGES,
  POINTS_EXCHANGE_RATE,
  MODEL_POINTS_COST,
  dollarsToPoints,
} from "@/lib/points";

interface PointsTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  model?: string;
  service?: string;
}

// Monthly points grant by plan
const MONTHLY_POINTS: Record<string, number> = {
  FREE: 0,
  BASIC: 300,
  PRO: 1200,
  BUSINESS: 4000,
};

export default function PointsPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState(0);
  const [monthlyGranted, setMonthlyGranted] = useState(0);
  const [purchasedPoints, setPurchasedPoints] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom recharge state
  const [customAmount, setCustomAmount] = useState("");
  const [customPoints, setCustomPoints] = useState(0);

  // Date filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchPointsData();
  }, []);

  // Calculate custom points when amount changes
  useEffect(() => {
    const amount = parseFloat(customAmount);
    if (amount && amount >= POINTS_EXCHANGE_RATE.MIN_RECHARGE) {
      setCustomPoints(dollarsToPoints(amount));
    } else {
      setCustomPoints(0);
    }
  }, [customAmount]);

  const fetchPointsData = async () => {
    try {
      const response = await fetch("/api/points");
      if (!response.ok) {
        throw new Error("Failed to fetch points data");
      }
      const data = await response.json();
      setBalance(data.balance);

      // Calculate monthly granted and purchased from transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let monthlyGrantTotal = 0;
      let purchasedTotal = 0;

      data.transactions.forEach((tx: PointsTransaction) => {
        const txDate = new Date(tx.createdAt);
        if (txDate >= startOfMonth && tx.type === "BONUS") {
          monthlyGrantTotal += tx.amount;
        }
        if (tx.type === "PURCHASE") {
          purchasedTotal += tx.amount;
        }
      });

      setMonthlyGranted(monthlyGrantTotal);
      setPurchasedPoints(purchasedTotal);
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load points data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsPurchasing(true);
    setError(null);

    try {
      const response = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, paymentMethod: "stripe" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Purchase failed");
      }

      const data = await response.json();
      setBalance(data.newBalance);
      setTransactions([data.transaction, ...transactions]);
      setPurchasedPoints((prev) => prev + data.purchasedPoints);
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handleCustomPurchase = async () => {
    if (!customPoints || customPoints < POINTS_EXCHANGE_RATE.POINTS_PER_DOLLAR) return;
    
    setIsPurchasing(true);
    setError(null);

    try {
      const response = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customAmount: parseFloat(customAmount), 
          paymentMethod: "stripe" 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Purchase failed");
      }

      const data = await response.json();
      setBalance(data.newBalance);
      setTransactions([data.transaction, ...transactions]);
      setPurchasedPoints((prev) => prev + data.purchasedPoints);
      setCustomAmount("");
      setCustomPoints(0);
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      if (startDate && txDate < new Date(startDate)) return false;
      if (endDate && txDate > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["日期", "服务", "模型", "积分", "描述"];
    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.createdAt),
      tx.service || tx.type,
      tx.model || "-",
      tx.amount,
      tx.description,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `积分消费记录_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <Coins className="h-4 w-4 text-green-400" />;
      case "USAGE":
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case "BONUS":
        return <Gift className="h-4 w-4 text-yellow-400" />;
      case "REFUND":
        return <ArrowUpCircle className="h-4 w-4 text-blue-400" />;
      default:
        return <Coins className="h-4 w-4 text-white/40" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-green-400/10 border-green-400/20";
      case "USAGE":
        return "bg-red-400/10 border-red-400/20";
      case "BONUS":
        return "bg-yellow-400/10 border-yellow-400/20";
      case "REFUND":
        return "bg-blue-400/10 border-blue-400/20";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  const plan = user?.plan || "FREE";
  const monthlyPoints = MONTHLY_POINTS[plan] || 0;

  // Get next reset date (first day of next month)
  const getNextResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if balance is low
  const isLowBalance = balance < 50;

  // Consumption guide data from MODEL_POINTS_COST
  const consumptionGuide = useMemo(() => {
    const guides = [];
    
    // 高端文字模型: 1点数/次
    const premiumText = MODEL_POINTS_COST.text.premium[0];
    if (premiumText) {
      guides.push({
        icon: Zap,
        title: "高端文字模型",
        description: "GPT-4o、Claude 3.5等",
        cost: premiumText.points,
        unit: "点数/次",
        color: "from-orange-500 to-red-500",
      });
    }
    
    // Midjourney绘图: 2点数/张
    const midjourney = MODEL_POINTS_COST.image.premium.find(m => m.id === "midjourney");
    if (midjourney) {
      guides.push({
        icon: Image,
        title: "Midjourney绘图",
        description: "AI高级绘图创作",
        cost: midjourney.points,
        unit: "点数/张",
        color: "from-purple-500 to-pink-500",
      });
    }
    
    // 普通短剧(10-15秒): 60点数/条
    const shortDramaBasic = MODEL_POINTS_COST.video.basic[0];
    if (shortDramaBasic) {
      guides.push({
        icon: Film,
        title: "普通短剧",
        description: "10-15秒视频生成",
        cost: shortDramaBasic.points,
        unit: "点数/条",
        color: "from-blue-500 to-cyan-500",
      });
    }
    
    // 超清短剧(15-25秒): 180点数/条
    const shortDramaPremium = MODEL_POINTS_COST.video.premium[0];
    if (shortDramaPremium) {
      guides.push({
        icon: Video,
        title: "超清短剧",
        description: "15-25秒高清视频",
        cost: shortDramaPremium.points,
        unit: "点数/条",
        color: "from-emerald-500 to-teal-500",
      });
    }
    
    return guides;
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">积分中心</h1>
            <p className="text-sm text-white/60">管理您的积分余额与消费记录</p>
          </div>
        </div>

        {/* Quick Recharge Button */}
        {isLowBalance && balance > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => {
                document.getElementById("packages-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] hover:opacity-90"
            >
              <Zap className="mr-2 h-4 w-4" />
              积分不足，立即充值
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Current Balance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-[#0066ff]/10 via-[#00d4ff]/5 to-purple-500/10 border-[#0066ff]/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0066ff]/20 to-transparent rounded-full -translate-y-32 translate-x-32" />
          <CardContent className="p-8 relative">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Available Points */}
              <div className="md:col-span-2">
                <p className="text-sm text-white/60 mb-2">可用点数</p>
                <div className="flex items-end gap-2">
                  {isLoading ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : (
                    <>
                      <p className="text-5xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                        {balance.toLocaleString()}
                      </p>
                      <p className="text-xl text-white/60 mb-2">点</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-white/50">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  永久有效 · 不清零 · 不过期
                </div>
              </div>

              {/* Points Breakdown */}
              <div className="space-y-4">
                {plan !== "FREE" && monthlyPoints > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/10">
                      <Crown className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/50">会员月度赠送</p>
                      <p className="text-lg font-semibold text-white">+{monthlyGranted.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-400/10">
                    <CreditCard className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">永久购买点数</p>
                    <p className="text-lg font-semibold text-white">+{purchasedPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Exchange Rate Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                  <Calculator className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">兑换比例说明</p>
                  <p className="text-sm text-white/60">1 美元 = {POINTS_EXCHANGE_RATE.POINTS_PER_DOLLAR} 点数</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-white/50">1 点数 =</p>
                  <p className="text-lg font-bold text-amber-400">${POINTS_EXCHANGE_RATE.DOLLARS_PER_POINT}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/50">最低充值</p>
                  <p className="text-lg font-bold text-amber-400">${POINTS_EXCHANGE_RATE.MIN_RECHARGE}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Member Quota Display */}
      {plan !== "FREE" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                会员权益
              </CardTitle>
              <CardDescription className="text-white/60">
                您当前的会员等级：<Badge className="ml-2 bg-gradient-to-r from-[#0066ff] to-[#00d4ff]">{plan}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Monthly Points */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/60">月度积分赠送</p>
                      <p className="text-xl font-bold text-white">{monthlyPoints.toLocaleString()} 点/月</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/40">本月已获得: {monthlyGranted.toLocaleString()} 点</p>
                </div>

                {/* Permanent Points */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                      <Coins className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/60">永久购买点数</p>
                      <p className="text-xl font-bold text-white">{purchasedPoints.toLocaleString()} 点</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/40">点数永久有效，不清零</p>
                </div>

                {/* Next Reset */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white/60">下次重置日期</p>
                      <p className="text-sm font-semibold text-white">{getNextResetDate()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/40">月度赠送将于每月1日重置</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Low Balance Warning */}
      {(balance === 0 || isLowBalance) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-400">积分余额不足</p>
              <p className="text-sm text-white/60">
                {balance === 0
                  ? "您的积分已用完，请充值以继续使用高级功能。"
                  : `您的积分余额较低（${balance}点），建议及时充值。`}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                document.getElementById("packages-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="ml-auto bg-yellow-500 text-black hover:bg-yellow-400"
            >
              立即充值
            </Button>
          </div>
        </motion.div>
      )}

      {/* Points Packages */}
      <motion.div
        id="packages-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#0066ff]" />
              固定充值套餐
            </CardTitle>
            <CardDescription className="text-white/60">
              选择积分套餐，大额套餐享受更多优惠
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {POINTS_PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isPurchasing}
                    className={cn(
                      "w-full rounded-xl border p-5 text-left transition-all relative overflow-hidden group",
                      pkg.badge === "热门"
                        ? "border-[#0066ff] bg-[#0066ff]/10 hover:bg-[#0066ff]/20"
                        : pkg.badge === "最佳价值"
                        ? "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20"
                        : pkg.discount >= 29
                        ? "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                      selectedPackage === pkg.id && "ring-2 ring-[#0066ff]",
                      isPurchasing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {pkg.badge && (
                      <div className={cn(
                        "absolute top-0 right-0 text-xs text-white px-2 py-1 rounded-bl-lg",
                        pkg.badge === "热门" ? "bg-gradient-to-r from-[#0066ff] to-[#00d4ff]" :
                        pkg.badge === "最佳价值" ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                        "bg-gradient-to-r from-emerald-500 to-teal-500"
                      )}>
                        {pkg.badge}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            pkg.badge === "热门"
                              ? "bg-gradient-to-br from-[#0066ff] to-[#00d4ff]"
                              : pkg.badge === "最佳价值"
                              ? "bg-gradient-to-br from-purple-500 to-pink-500"
                              : pkg.discount >= 29
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                              : "bg-white/10"
                          )}
                        >
                          <Coins className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">
                          {pkg.points.toLocaleString()} 点
                        </span>
                      </div>
                      {pkg.discount && pkg.discount > 0 && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-xs">
                          省{pkg.discount}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        ${pkg.price}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      ${pkg.perPoint.toFixed(3)}/点
                    </p>
                    <Button
                      className="mt-4 w-full"
                      variant={pkg.badge ? "default" : "outline"}
                      disabled={isPurchasing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg.id);
                      }}
                    >
                      {isPurchasing && selectedPackage === pkg.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          立即购买
                        </>
                      )}
                    </Button>
                  </button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Custom Recharge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-400" />
              自定义充值
            </CardTitle>
            <CardDescription className="text-white/60">
              输入任意金额，最小 ${POINTS_EXCHANGE_RATE.MIN_RECHARGE}，按 1:50 比例充值
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-sm text-white/60 mb-2 block">充值金额 (美元)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <Input
                    type="number"
                    min={POINTS_EXCHANGE_RATE.MIN_RECHARGE}
                    step="0.01"
                    placeholder={`最低 ${POINTS_EXCHANGE_RATE.MIN_RECHARGE}`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-7 bg-white/5 border-white/10 text-white text-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div className="flex-1 w-full">
                <label className="text-sm text-white/60 mb-2 block">将获得点数</label>
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center">
                  <span className="text-2xl font-bold text-indigo-400">{customPoints.toLocaleString()}</span>
                  <span className="text-white/60 ml-1">点</span>
                </div>
              </div>
              <Button
                onClick={handleCustomPurchase}
                disabled={!customPoints || isPurchasing}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 w-full md:w-auto"
              >
                {isPurchasing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    确认充值
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
              <Calculator className="h-4 w-4" />
              <span>实时换算：${customAmount || "0"} = {customPoints.toLocaleString()} 点数</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#00d4ff]" />
              消费指南
            </CardTitle>
            <CardDescription className="text-white/60">
              了解不同AI服务的点数消耗
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {consumptionGuide.map((guide) => (
                <div
                  key={guide.title}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
                    guide.color
                  )}>
                    <guide.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{guide.title}</p>
                    <p className="text-xs text-white/50">{guide.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-white/80 border-white/20 text-sm px-3 py-1">
                      {guide.cost} {guide.unit}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Purchase Success/Error Messages */}
      {purchaseSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400 border border-green-400/20"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">
            购买成功！积分已添加到您的账户。
          </span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-400 border border-red-400/20"
        >
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {/* Consumption History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-[#0066ff]" />
                  消费记录
                </CardTitle>
                <CardDescription className="text-white/60">
                  查看您的积分充值和使用记录
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="开始日期"
                    className="w-36"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="结束日期"
                    className="w-36"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={filteredTransactions.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  导出CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-white/40" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/60">暂无交易记录</p>
                <p className="text-sm text-white/40 mt-1">
                  {transactions.length > 0 ? "当前筛选条件下无记录" : "购买积分套餐开始您的积分之旅"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                        日期
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                        服务
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                        模型
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                        积分
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                        描述
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map((tx, index) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.03 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                          {formatDateShort(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                              {getTransactionIcon(tx.type)}
                            </div>
                            <span className="text-sm text-white">
                              {tx.service || (tx.type === "PURCHASE" ? "充值" : tx.type === "USAGE" ? "使用" : tx.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/50">
                          {tx.model || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              tx.amount > 0 ? "text-green-400" : "text-red-400"
                            )}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60 max-w-xs truncate">
                          {tx.description}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
