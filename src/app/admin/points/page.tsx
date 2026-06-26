"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Users,
  Type,
  Image,
  Video,
  Sparkles,
  RefreshCw,
  Download,
  Search,
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  AlertTriangle,
  Lock,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Zap,
  Gift,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  MODEL_POINTS_COST,
  LOCKED_PROFIT_MULTIPLIERS,
} from "@/lib/points/exchange-rate";

// === 类型定义 ===

interface ConsumptionStats {
  period: {
    today: { points: number; count: number };
    month: { points: number; count: number };
    year: { points: number; count: number };
    custom: { start: string; end: string } | null;
  };
  byServiceType: Array<{ serviceType: string; points: number; count: number }>;
  topModels: Array<{ modelId: string; points: number; count: number }>;
  topConsumers: Array<{
    userId: string;
    user: { email: string; name: string; plan: string } | null;
    totalPoints: number;
    requestCount: number;
  }>;
  systemStats: {
    totalUsers: number;
    totalPointsInSystem: number;
    totalMonthlyPoints: number;
    totalPointsConsumedThisMonth: number;
    usersByPlan: Record<string, number>;
  };
}

interface ModelPricing {
  id: string;
  serviceType: string;
  modelName: string;
  modelId: string;
  tier: string;
  provider: string;
  baseCost: number;
  multiplier: number;
  finalPrice: number;
  lockedMin: number;
  isLocked: boolean;
  isEnabled: boolean;
  allowedPlans: string[];
  description: string;
}

interface UserPoints {
  id: string;
  email: string;
  name: string;
  plan: string;
  createdAt: string;
  points: number;
  monthlyPoints: number;
  totalPoints: number;
  shortDramaQuota: number;
  shortDramaUsed: number;
  lastPointsReset: string | null;
}

interface ConsumptionLog {
  id: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceType: string;
  modelId: string;
  pointsUsed: number;
  inputTokens: number | null;
  outputTokens: number | null;
  deductedFrom: string;
}

interface MonthlyGrantStats {
  lastGrant: { date: string; count: number } | null;
  pendingGrants: Record<string, { count: number; totalPoints: number }>;
  totalPending: { users: number; points: number };
  schedule: {
    autoGrant: boolean;
    scheduledDay: number;
    nextGrantDate: string;
  };
}

// === 服务类型图标映射 ===

const serviceTypeIcons: Record<string, React.ElementType> = {
  TEXT_BASIC: Type,
  TEXT_HIGH_END: Type,
  IMAGE_BASIC: Image,
  IMAGE_HIGH_END: Image,
  VIDEO_BASIC: Video,
  VIDEO_HD: Video,
  SHORT_DRAMA_BASIC: Sparkles,
  SHORT_DRAMA_HD: Sparkles,
  OPENROUTER_FREE: Type,
};

const serviceTypeLabels: Record<string, string> = {
  TEXT_BASIC: "基础文本",
  TEXT_HIGH_END: "高端文本",
  IMAGE_BASIC: "基础图像",
  IMAGE_HIGH_END: "高端图像",
  VIDEO_BASIC: "基础视频",
  VIDEO_HD: "高清视频",
  SHORT_DRAMA_BASIC: "AI短剧基础",
  SHORT_DRAMA_HD: "AI短剧高清",
  OPENROUTER_FREE: "免费模型",
};

const planColors: Record<string, string> = {
  FREE: "#6b7280",
  BASIC: "#22c55e",
  PRO: "#0066ff",
  BUSINESS: "#a855f7",
};

// === 主组件 ===

export default function PointsManagementPage() {
  // Tabs state
  const [activeTab, setActiveTab] = useState("stats");

  // Stats state
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Pricing state
  const [pricing, setPricing] = useState<ModelPricing[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [editMultiplier, setEditMultiplier] = useState<number>(0);
  const [pricingFilter, setPricingFilter] = useState("all");
  const [pricingSearch, setPricingSearch] = useState("");

  // Users state
  const [users, setUsers] = useState<UserPoints[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserPoints | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");

  // Logs state
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logFilters, setLogFilters] = useState({
    startDate: "",
    endDate: "",
    serviceType: "",
    userId: "",
  });

  // Monthly grant state
  const [monthlyStats, setMonthlyStats] = useState<MonthlyGrantStats | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [granting, setGranting] = useState(false);

  // 加载初始数据
  useEffect(() => {
    fetchStats();
    fetchPricing();
    fetchMonthlyStats();
  }, []);

  // 切换tab时加载相应数据
  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      fetchUsers();
    }
    if (activeTab === "logs" && logs.length === 0) {
      fetchLogs();
    }
  }, [activeTab]);

  // === 数据获取函数 ===

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch("/api/admin/points?type=stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      setPricingLoading(true);
      const res = await fetch("/api/admin/points?type=pricing");
      if (res.ok) {
        const data = await res.json();
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
    } finally {
      setPricingLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      if (userSearch) params.set("userEmail", userSearch);
      params.set("page", userPage.toString());
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/points?type=users&${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/points?type=user&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserDetail(data);
      }
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const params = new URLSearchParams();
      if (logFilters.startDate) params.set("startDate", logFilters.startDate);
      if (logFilters.endDate) params.set("endDate", logFilters.endDate);
      if (logFilters.serviceType) params.set("serviceType", logFilters.serviceType);
      if (logFilters.userId) params.set("userId", logFilters.userId);
      params.set("page", logsPage.toString());
      params.set("pageSize", "20");

      const res = await fetch(`/api/admin/points?type=logs&${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalLogs(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      setMonthlyLoading(true);
      const res = await fetch("/api/admin/points?type=monthly");
      if (res.ok) {
        const data = await res.json();
        setMonthlyStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch monthly stats:", error);
    } finally {
      setMonthlyLoading(false);
    }
  };

  // === 操作函数 ===

  const handleUpdatePricing = async (modelId: string) => {
    if (editMultiplier <= 0) return;

    try {
      const res = await fetch("/api/admin/points", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          multiplier: editMultiplier,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPricing((prev) =>
          prev.map((p) =>
            p.modelId === modelId ? { ...p, ...data.pricing } : p
          )
        );
        setEditingPricing(null);
      } else {
        const error = await res.json();
        alert(error.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update pricing:", error);
    }
  };

  const handleTogglePricing = async (modelId: string, isEnabled: boolean) => {
    try {
      const res = await fetch("/api/admin/points", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          isEnabled: !isEnabled,
        }),
      });

      if (res.ok) {
        setPricing((prev) =>
          prev.map((p) =>
            p.modelId === modelId ? { ...p, isEnabled: !isEnabled } : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle pricing:", error);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser || adjustAmount === 0 || !adjustReason) return;

    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: adjustAmount,
          reason: adjustReason,
          type: adjustType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdjustDialog(false);
        setAdjustAmount(0);
        setAdjustReason("");
        fetchUsers();
        if (selectedUser) {
          fetchUserDetail(selectedUser.id);
        }
        alert(data.success ? `成功调整 ${adjustAmount} 积分` : "调整失败");
      }
    } catch (error) {
      console.error("Failed to adjust points:", error);
    }
  };

  const handleGrantMonthly = async () => {
    try {
      setGranting(true);
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grantMonthly" }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchMonthlyStats();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to grant monthly:", error);
    } finally {
      setGranting(false);
    }
  };

  const handleExportLogs = () => {
    if (logs.length === 0) return;

    const csv = [
      "日期,用户邮箱,服务类型,模型ID,积分,输入Token,输出Token,扣减来源",
      ...logs.map((log) =>
        [
          new Date(log.createdAt).toLocaleString(),
          log.userEmail,
          log.serviceType,
          log.modelId,
          log.pointsUsed,
          log.inputTokens || "",
          log.outputTokens || "",
          log.deductedFrom,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `积分消费日志_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // === 过滤和分组 ===

  const filteredPricing = useMemo(() => {
    let filtered = pricing;

    if (pricingSearch) {
      const search = pricingSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.modelId.toLowerCase().includes(search) ||
          p.modelName.toLowerCase().includes(search)
      );
    }

    if (pricingFilter !== "all") {
      filtered = filtered.filter((p) => p.serviceType === pricingFilter);
    }

    return filtered;
  }, [pricing, pricingSearch, pricingFilter]);

  const groupedPricing = useMemo(() => {
    const groups: Record<string, ModelPricing[]> = {};
    for (const p of filteredPricing) {
      if (!groups[p.serviceType]) {
        groups[p.serviceType] = [];
      }
      groups[p.serviceType].push(p);
    }
    return groups;
  }, [filteredPricing]);

  // === 渲染 ===

  if (statsLoading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">积分管理</h1>
          <p className="text-white/60 mt-1">
            管理系统积分消费、定价配置和用户积分
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              fetchPricing();
              fetchMonthlyStats();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            消费统计
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="w-4 h-4 mr-2" />
            定价管理
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            用户积分
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="w-4 h-4 mr-2" />
            消费日志
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <Gift className="w-4 h-4 mr-2" />
            月度发放
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 消费统计 */}
        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <>
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/60">今日消费</p>
                          <p className="text-2xl font-bold text-white">
                            {stats.period.today.points}
                          </p>
                          <p className="text-xs text-white/40">
                            {stats.period.today.count} 次请求
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/60">本月消费</p>
                          <p className="text-2xl font-bold text-[#0066ff]">
                            {stats.period.month.points}
                          </p>
                          <p className="text-xs text-white/40">
                            {stats.period.month.count} 次请求
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-[#0066ff]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/60">本年消费</p>
                          <p className="text-2xl font-bold text-[#00d4ff]">
                            {stats.period.year.points}
                          </p>
                          <p className="text-xs text-white/40">
                            {stats.period.year.count} 次请求
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
                          <Coins className="w-5 h-5 text-[#00d4ff]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/60">系统总积分</p>
                          <p className="text-2xl font-bold text-green-400">
                            {stats.systemStats.totalPointsInSystem +
                              stats.systemStats.totalMonthlyPoints}
                          </p>
                          <p className="text-xs text-white/40">
                            {stats.systemStats.totalUsers} 用户
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* 按服务类型统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">按服务类型消费</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {stats.byServiceType.map((s) => {
                      const Icon = serviceTypeIcons[s.serviceType] || Type;
                      const label =
                        serviceTypeLabels[s.serviceType] || s.serviceType;
                      const totalPoints = stats.period.month.points || 1;
                      const percentage = Math.min(
                        100,
                        (s.points / totalPoints) * 100
                      );

                      return (
                        <div
                          key={s.serviceType}
                          className="p-4 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-[#00d4ff]" />
                            <span className="text-sm text-white/60">{label}</span>
                          </div>
                          <p className="text-xl font-bold text-white">
                            {s.points}
                          </p>
                          <p className="text-xs text-white/40 mb-2">
                            {s.count} 次
                          </p>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 最常用模型 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">最常用模型</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topModels.map((m, index) => (
                      <div
                        key={m.modelId}
                        className="flex items-center gap-4 p-3 rounded-lg bg-white/5"
                      >
                        <span className="text-lg font-bold text-white/40 w-8">
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <code className="text-sm text-white bg-white/10 px-2 py-1 rounded">
                            {m.modelId}
                          </code>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#00d4ff]">
                            {m.points} 积分
                          </p>
                          <p className="text-xs text-white/40">
                            {m.count} 次调用
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 消费最多的用户 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">消费最多的用户</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                            用户
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                            会员
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-white/60">
                            消费积分
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-white/60">
                            请求次数
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topConsumers.map((u) => (
                          <tr
                            key={u.userId}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-xs">
                                  {u.user?.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <p className="text-sm text-white">
                                    {u.user?.name || "未知"}
                                  </p>
                                  <p className="text-xs text-white/40">
                                    {u.user?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                style={{
                                  backgroundColor:
                                    planColors[u.user?.plan || "FREE"] + "20",
                                  color: planColors[u.user?.plan || "FREE"],
                                  borderColor:
                                    planColors[u.user?.plan || "FREE"] + "40",
                                }}
                                variant="outline"
                              >
                                {u.user?.plan || "FREE"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right text-sm font-bold text-[#00d4ff]">
                              {u.totalPoints}
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-white/60">
                              {u.requestCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* 会员分布 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">会员分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(stats.systemStats.usersByPlan).map(
                      ([plan, count]) => (
                        <div
                          key={plan}
                          className="p-4 rounded-lg bg-white/5 border border-white/10 text-center"
                        >
                          <Badge
                            style={{
                              backgroundColor: planColors[plan] + "20",
                              color: planColors[plan],
                            }}
                            variant="outline"
                            className="mb-2"
                          >
                            {plan}
                          </Badge>
                          <p className="text-xl font-bold text-white">{count}</p>
                          <p className="text-xs text-white/40">用户</p>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab 2: 定价管理 */}
        <TabsContent value="pricing" className="space-y-6">
          {/* 定价过滤器 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="搜索模型..."
                value={pricingSearch}
                onChange={(e) => setPricingSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={pricingFilter} onValueChange={setPricingFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="服务类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="TEXT_BASIC">基础文本</SelectItem>
                <SelectItem value="TEXT_HIGH_END">高端文本</SelectItem>
                <SelectItem value="IMAGE_BASIC">基础图像</SelectItem>
                <SelectItem value="IMAGE_HIGH_END">高端图像</SelectItem>
                <SelectItem value="VIDEO_BASIC">基础视频</SelectItem>
                <SelectItem value="VIDEO_HD">高清视频</SelectItem>
                <SelectItem value="SHORT_DRAMA_BASIC">AI短剧基础</SelectItem>
                <SelectItem value="SHORT_DRAMA_HD">AI短剧高清</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filteredPricing.length} 模型</Badge>
          </div>

          {/* 锁定配置警告 */}
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-500">
                    固定定价配置
                  </p>
                  <div className="text-xs text-white/60 space-y-1">
                    <p>🔒 <span className="text-yellow-400">锁定倍率</span> - 高端模型倍率已锁定，不可修改</p>
                    <p>🔐 <span className="text-red-400">强制锁定</span> - 视频类模型倍率强制20倍，禁止调低</p>
                    <p className="pt-1 border-t border-white/10 mt-2">
                      <span className="text-[#00d4ff]">高端文字模型</span> (GPT-4o, Claude 3.5) 8倍倍率 | 
                      <span className="text-[#00d4ff]"> 高端绘图模型</span> (Midjourney) 12倍倍率 | 
                      <span className="text-red-400"> 短剧视频</span> 强制20倍
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 模型点数成本速查表 */}
          <Card className="border-[#00d4ff]/20 bg-[#00d4ff]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#00d4ff]">模型点数成本速查</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="p-2 rounded bg-white/5">
                  <p className="text-white/60">GPT-4o</p>
                  <p className="text-[#00d4ff] font-bold">1 点数/次</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <p className="text-white/60">Claude 3.5</p>
                  <p className="text-[#00d4ff] font-bold">1 点数/次</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <p className="text-white/60">Midjourney</p>
                  <p className="text-[#00d4ff] font-bold">2 点数/张</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <p className="text-white/60">普通短剧</p>
                  <p className="text-red-400 font-bold">60 点数/条</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <p className="text-white/60">超清短剧</p>
                  <p className="text-red-400 font-bold">180 点数/条</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 按服务类型分组的定价表 */}
          {Object.entries(groupedPricing).map(([serviceType, models]) => {
            const Icon = serviceTypeIcons[serviceType] || Type;
            const label = serviceTypeLabels[serviceType] || serviceType;

            return (
              <div key={serviceType} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#0066ff]" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{label}</h2>
                  <Badge variant="outline">{models.length} 模型</Badge>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/60">
                            模型
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/60">
                            基础积分
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/60">
                            倍率
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/60">
                            最终积分
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/60">
                            锁定最低
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-white/60">
                            状态
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-white/60">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {models.map((model) => {
                          const isEditing = editingPricing === model.id;
                          const isBelowMin =
                            isEditing && editMultiplier < model.lockedMin;
                          const isLocked = model.isLocked;
                          const isMandatory = 'mandatory' in model ? (model as { mandatory?: boolean }).mandatory : false;

                          return (
                            <tr
                              key={model.id}
                              className={`border-b border-white/5 ${
                                !model.isEnabled ? "opacity-60" : ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-white font-medium">
                                      {model.modelName}
                                    </p>
                                    {/* 锁定/强制锁定徽章 */}
                                    {isMandatory ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-red-400">
                                        <span>🔐</span>
                                      </span>
                                    ) : isLocked ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                                        <span>🔒</span>
                                      </span>
                                    ) : null}
                                  </div>
                                  <code className="text-xs text-white/40 bg-white/5 px-1 rounded">
                                    {model.modelId}
                                  </code>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-white">
                                {model.baseCost}
                              </td>
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min={model.lockedMin}
                                      value={editMultiplier}
                                      onChange={(e) =>
                                        setEditMultiplier(
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className={`w-24 ${
                                        isBelowMin
                                          ? "border-red-500 focus:border-red-500"
                                          : ""
                                      }`}
                                    />
                                    {isBelowMin && (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                ) : (
                                  <Badge
                                    variant={
                                      isMandatory
                                        ? "destructive"
                                        : model.multiplier >= 10
                                        ? "default"
                                        : model.multiplier >= 5
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className={
                                      isMandatory
                                        ? "bg-red-500/20 text-red-400 border-red-500/50"
                                        : isLocked
                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                        : ""
                                    }
                                  >
                                    {isMandatory && <span className="mr-1">🔐</span>}
                                    {!isMandatory && isLocked && <span className="mr-1">🔒</span>}
                                    {model.multiplier.toFixed(1)}x
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-[#00d4ff]">
                                {isEditing
                                  ? Math.ceil(model.baseCost * editMultiplier)
                                  : model.finalPrice}
                              </td>
                              <td className="px-4 py-3">
                                {isLocked ? (
                                  <div className="flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs text-yellow-500">
                                      {model.lockedMin}x
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-white/40">
                                    无限制
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Switch
                                  checked={model.isEnabled}
                                  onCheckedChange={() =>
                                    handleTogglePricing(
                                      model.modelId,
                                      model.isEnabled
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdatePricing(model.modelId)
                                      }
                                      disabled={isBelowMin && isLocked}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      保存
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingPricing(null)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingPricing(model.id);
                                      setEditMultiplier(model.multiplier);
                                    }}
                                  >
                                    <Edit3 className="w-4 h-4 mr-1" />
                                    编辑
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            );
          })}

          {filteredPricing.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-lg font-medium text-white/60">
                没有找到模型
              </h3>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: 用户积分 */}
        <TabsContent value="users" className="space-y-6">
          {/* 搜索 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="搜索用户邮箱..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              搜索
            </Button>
          </div>

          {/* 用户列表 */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                        用户
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                        会员
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                        永久积分
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                        月度积分
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                        总积分
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                        短剧配额
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#0066ff] mx-auto" />
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-xs font-medium">
                                {user.name?.charAt(0) || user.email.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">
                                  {user.name || "未知"}
                                </p>
                                <p className="text-xs text-white/40">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              style={{
                                backgroundColor: planColors[user.plan] + "20",
                                color: planColors[user.plan],
                              }}
                              variant="outline"
                            >
                              {user.plan}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right text-sm text-white">
                            {user.points}
                          </td>
                          <td className="py-4 px-4 text-right text-sm text-[#00d4ff]">
                            {user.monthlyPoints}
                          </td>
                          <td className="py-4 px-4 text-right text-sm font-bold text-white">
                            {user.totalPoints}
                          </td>
                          <td className="py-4 px-4 text-right text-sm text-white/60">
                            {user.shortDramaUsed}/{user.shortDramaQuota}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user);
                                fetchUserDetail(user.id);
                              }}
                            >
                              <Coins className="w-4 h-4 mr-1" />
                              管理
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="flex items-center justify-between py-4 px-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  显示 {(userPage - 1) * 20 + 1} - {Math.min(userPage * 20, totalUsers)} / {totalUsers} 用户
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={userPage === 1}
                    onClick={() => {
                      setUserPage(userPage - 1);
                      fetchUsers();
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-white/60">
                    第 {userPage} 页
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={userPage >= Math.ceil(totalUsers / 20)}
                    onClick={() => {
                      setUserPage(userPage + 1);
                      fetchUsers();
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 用户详情弹窗 */}
          <Dialog
            open={!!selectedUser && !!userDetail}
            onOpenChange={() => {
              setSelectedUser(null);
              setUserDetail(null);
            }}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>用户积分管理</DialogTitle>
                <DialogDescription>
                  {selectedUser?.email} 的积分详情
                </DialogDescription>
              </DialogHeader>
              {userDetail && (
                <div className="space-y-6">
                  {/* 积分概览 */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-white/60">永久积分</p>
                        <p className="text-xl font-bold text-white">
                          {userDetail.balance.permanentPoints}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-white/60">月度积分</p>
                        <p className="text-xl font-bold text-[#00d4ff]">
                          {userDetail.balance.monthlyPoints}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-white/60">总可用积分</p>
                        <p className="text-xl font-bold text-green-400">
                          {userDetail.balance.totalAvailable}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-white/60">会员等级</p>
                        <Badge
                          style={{
                            backgroundColor:
                              planColors[userDetail.user.plan] + "20",
                            color: planColors[userDetail.user.plan],
                          }}
                          variant="outline"
                          className="mt-1"
                        >
                          {userDetail.plan.name} - ${userDetail.plan.monthlyPrice}/月
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 手动调整积分 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">手动调整积分</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Select
                          value={adjustType}
                          onValueChange={(v) =>
                            setAdjustType(v as "add" | "deduct")
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">
                              <Plus className="w-3 h-3 inline mr-1" />
                              增加
                            </SelectItem>
                            <SelectItem value="deduct">
                              <Minus className="w-3 h-3 inline mr-1" />
                              扣减
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          value={adjustAmount}
                          onChange={(e) =>
                            setAdjustAmount(parseInt(e.target.value) || 0)
                          }
                          placeholder="积分数量"
                          className="w-32"
                        />
                        <Input
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          placeholder="调整原因"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => setAdjustDialog(true)}
                          disabled={adjustAmount <= 0 || !adjustReason}
                        >
                          确认调整
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 消费历史 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">消费历史（最近10条）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userDetail.consumptionHistory
                          .slice(0, 10)
                          .map((log: any) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between p-2 rounded bg-white/5"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {log.serviceType}
                                </Badge>
                                <code className="text-xs text-white/40">
                                  {log.modelId}
                                </code>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-red-400">
                                  -{log.pointsUsed}
                                </p>
                                <p className="text-xs text-white/40">
                                  {new Date(log.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* 确认调整弹窗 */}
          <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>确认调整积分</DialogTitle>
                <DialogDescription>
                  确定要为 {selectedUser?.email} {adjustType === "add" ? "增加" : "扣减"} {adjustAmount} 积分吗？
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-white/60">原因：{adjustReason}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdjustDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleAdjustPoints}>确认</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab 4: 消费日志 */}
        <TabsContent value="logs" className="space-y-6">
          {/* 过滤器 */}
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={logFilters.startDate}
              onChange={(e) =>
                setLogFilters({ ...logFilters, startDate: e.target.value })
              }
              placeholder="开始日期"
              className="w-40"
            />
            <Input
              type="date"
              value={logFilters.endDate}
              onChange={(e) =>
                setLogFilters({ ...logFilters, endDate: e.target.value })
              }
              placeholder="结束日期"
              className="w-40"
            />
            <Select
              value={logFilters.serviceType}
              onValueChange={(v) =>
                setLogFilters({ ...logFilters, serviceType: v })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="服务类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                <SelectItem value="TEXT_BASIC">基础文本</SelectItem>
                <SelectItem value="TEXT_HIGH_END">高端文本</SelectItem>
                <SelectItem value="IMAGE_BASIC">基础图像</SelectItem>
                <SelectItem value="IMAGE_HIGH_END">高端图像</SelectItem>
                <SelectItem value="VIDEO_BASIC">基础视频</SelectItem>
                <SelectItem value="VIDEO_HD">高清视频</SelectItem>
                <SelectItem value="SHORT_DRAMA_BASIC">AI短剧基础</SelectItem>
                <SelectItem value="SHORT_DRAMA_HD">AI短剧高清</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              应用过滤
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              disabled={logs.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              导出CSV
            </Button>
          </div>

          {/* 日志表 */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                        时间
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                        用户
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                        服务
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                        模型
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                        积分
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                        Tokens
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                        来源
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#0066ff] mx-auto" />
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-white/60">
                          暂无消费记录
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="py-3 px-4">
                            <p className="text-sm text-white">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-white/40">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-white">{log.userName}</p>
                            <p className="text-xs text-white/40">
                              {log.userEmail}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">
                              {serviceTypeLabels[log.serviceType] ||
                                log.serviceType}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-xs text-white/40 bg-white/5 px-1 rounded">
                              {log.modelId}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-red-400">
                            -{log.pointsUsed}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-white/60">
                            {log.inputTokens || "-"}/{log.outputTokens || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              {log.deductedFrom}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="flex items-center justify-between py-4 px-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  显示 {(logsPage - 1) * 20 + 1} - {Math.min(logsPage * 20, totalLogs)} / {totalLogs} 条
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={logsPage === 1}
                    onClick={() => {
                      setLogsPage(logsPage - 1);
                      fetchLogs();
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-white/60">第 {logsPage} 页</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={logsPage >= Math.ceil(totalLogs / 20)}
                    onClick={() => {
                      setLogsPage(logsPage + 1);
                      fetchLogs();
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: 月度发放 */}
        <TabsContent value="monthly" className="space-y-6">
          {monthlyLoading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
            </div>
          ) : monthlyStats ? (
            <>
              {/* 发放状态卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">上次发放</p>
                        {monthlyStats.lastGrant ? (
                          <>
                            <p className="text-xl font-bold text-white">
                              {new Date(monthlyStats.lastGrant.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-white/40">
                              {monthlyStats.lastGrant.count} 名会员
                            </p>
                          </>
                        ) : (
                          <p className="text-xl font-bold text-white/40">
                            未发放
                          </p>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">待发放用户</p>
                        <p className="text-xl font-bold text-[#00d4ff]">
                          {monthlyStats.totalPending.users}
                        </p>
                        <p className="text-xs text-white/40">
                          付费会员总数
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#00d4ff]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/60">待发放积分</p>
                        <p className="text-xl font-bold text-[#0066ff]">
                          {monthlyStats.totalPending.points}
                        </p>
                        <p className="text-xs text-white/40">
                          本月预计发放
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-[#0066ff]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 各会员等级待发放 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">各会员等级待发放统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(monthlyStats.pendingGrants)
                      .filter(([plan]) => plan !== "FREE")
                      .map(([plan, data]) => (
                        <div
                          key={plan}
                          className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Badge
                              style={{
                                backgroundColor: planColors[plan] + "20",
                                color: planColors[plan],
                              }}
                              variant="outline"
                            >
                              {plan}
                            </Badge>
                            <span className="text-sm text-white">
                              {data.count} 名会员
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#00d4ff]">
                              {data.totalPoints} 积分
                            </p>
                            <p className="text-xs text-white/40">
                              {data.count > 0
                                ? Math.round(data.totalPoints / data.count)
                                : 0} 积分/人
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* 自动发放设置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">自动发放设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#00d4ff]" />
                      <div>
                        <p className="text-sm text-white">自动发放</p>
                        <p className="text-xs text-white/40">
                          每月 {monthlyStats.schedule.scheduledDay} 日自动发放月度积分
                        </p>
                      </div>
                    </div>
                    <Switch checked={monthlyStats.schedule.autoGrant} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#00d4ff]" />
                      <div>
                        <p className="text-sm text-white">下次发放日期</p>
                        <p className="text-xs text-white/40">
                          {new Date(monthlyStats.schedule.nextGrantDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {Math.ceil(
                        (new Date(monthlyStats.schedule.nextGrantDate).getTime() -
                          Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )} 天后
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 手动触发发放 */}
              <Card className="border-[#0066ff]/20 bg-[#0066ff]/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-[#0066ff]" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">
                          手动触发月度发放
                        </p>
                        <p className="text-sm text-white/60">
                          立即为所有付费会员发放本月的月度积分
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleGrantMonthly}
                      disabled={granting}
                      isLoading={granting}
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      立即发放
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 发放配置说明 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">月度积分发放规则</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-500/20 text-green-400">
                          BASIC
                        </Badge>
                        <span className="text-sm text-white">$7.99/月</span>
                      </div>
                      <p className="text-sm text-white/60">
                        每月发放 <span className="text-[#00d4ff] font-bold">300</span> 积分 +
                        <span className="text-[#00d4ff] font-bold">3</span> 次免费短剧配额
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-[#0066ff]/20 text-[#0066ff]">
                          PRO
                        </Badge>
                        <span className="text-sm text-white">$19.99/月</span>
                      </div>
                      <p className="text-sm text-white/60">
                        每月发放 <span className="text-[#00d4ff] font-bold">1200</span> 积分 +
                        <span className="text-[#00d4ff] font-bold">30</span> 次免费短剧配额
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400">
                          BUSINESS
                        </Badge>
                        <span className="text-sm text-white">$49.99/月</span>
                      </div>
                      <p className="text-sm text-white/60">
                        每月发放 <span className="text-[#00d4ff] font-bold">4000</span> 积分 +
                        <span className="text-[#00d4ff] font-bold">100</span> 次免费短剧配额
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}