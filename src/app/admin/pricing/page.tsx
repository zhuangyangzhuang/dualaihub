"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Edit3,
  Save,
  X,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Type,
  Code,
  Image,
  Video,
  Music,
  Loader2,
  Lock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LOCKED_PROFIT_MULTIPLIERS,
  MODEL_POINTS_COST,
  isMultiplierLocked,
  isMultiplierMandatoryLocked,
} from "@/lib/points/exchange-rate";

// 服务类型配置
const serviceTypeConfig: Record<string, {
  icon: React.ElementType;
  label: string;
  tierLabels: Record<string, string>;
}> = {
  text: {
    icon: Type,
    label: "文本AI",
    tierLabels: {
      free: "免费文本",
      basic: "基础文本",
      premium: "高端文本",
    },
  },
  code: {
    icon: Code,
    label: "代码AI",
    tierLabels: {
      free: "免费代码",
      basic: "基础代码",
      premium: "高端代码",
    },
  },
  image: {
    icon: Image,
    label: "图像AI",
    tierLabels: {
      free: "免费图像",
      basic: "基础图像",
      premium: "高端图像",
    },
  },
  video: {
    icon: Video,
    label: "视频AI",
    tierLabels: {
      basic: "普通短剧",
      premium: "超清短剧",
    },
  },
  music: {
    icon: Music,
    label: "音乐AI",
    tierLabels: {
      free: "免费音乐",
      basic: "基础音乐",
    },
  },
};

// 获取模型点数成本
function getModelPointsCost(modelId: string, serviceType: string): number {
  const service = MODEL_POINTS_COST[serviceType as keyof typeof MODEL_POINTS_COST];
  if (!service) return 1;

  const tierOrder = ['free', 'basic', 'premium'] as const;
  for (const tier of tierOrder) {
    if (tier in service) {
      const models = (service as unknown as Record<string, Array<{id: string; points: number}>>)[tier];
      if (models && Array.isArray(models)) {
        const model = models.find((m) => m.id === modelId);
        if (model) return model.points;
      }
    }
  }
  return 1;
}

// 获取模型倍率
function getModelMultiplier(modelId: string, serviceType: string): number {
  const service = MODEL_POINTS_COST[serviceType as keyof typeof MODEL_POINTS_COST];
  if (!service) return 1;

  const tierOrder = ['free', 'basic', 'premium'] as const;
  for (const tier of tierOrder) {
    if (tier in service) {
      const models = (service as unknown as Record<string, Array<{id: string; multiplier: number}>>)[tier];
      if (models && Array.isArray(models)) {
        const model = models.find((m) => m.id === modelId);
        if (model) return model.multiplier;
      }
    }
  }
  return 1;
}

export default function PricingManagementPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/pricing");
      if (res.ok) {
        const data = await res.json();
        setServices(data.pricing || []);
      } else {
        // 使用默认配置数据
        setServices(generateDefaultServices());
      }
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
      setServices(generateDefaultServices());
    } finally {
      setIsLoading(false);
    }
  };

  // 生成默认服务数据
  const generateDefaultServices = () => {
    const result: any[] = [];
    const serviceTypes = ["text", "code", "image", "video", "music"] as const;

    serviceTypes.forEach((serviceType) => {
      const service = MODEL_POINTS_COST[serviceType];
      if (!service) return;

      const tierOrder = ['free', 'basic', 'premium'] as const;
      tierOrder.forEach((tier) => {
        if (!(tier in service)) return;
        const models = (service as unknown as Record<string, Array<{id: string; name: string; points: number; multiplier: number; locked?: boolean; mandatory?: boolean}>>)[tier];
        if (models && Array.isArray(models)) {
          models.forEach((model) => {
            result.push({
              id: `${serviceType}-${tier}-${model.id}`,
              serviceType,
              tier,
              modelId: model.id,
              modelName: model.name,
              baseCost: 0.001,
              pointsCost: model.points,
              multiplier: model.multiplier,
              isLocked: model.locked || false,
              isMandatory: model.mandatory || false,
              isEnabled: true,
              updatedAt: new Date().toISOString(),
            });
          });
        }
      });
    });

    return result;
  };

  const handleEdit = (service: any) => {
    if (service.isLocked) return;
    setEditingId(service.id);
    setEditForm({
      baseCost: service.baseCost,
      pointsCost: service.pointsCost,
    });
    setWarningMessage(null);
  };

  const handleSave = async (service: any) => {
    // 检查是否是强制锁定模型（视频类）
    if (service.isMandatory && editForm.multiplier !== undefined && editForm.multiplier < 20) {
      setWarningMessage(`${service.modelName} 的倍率不能低于20倍！这是系统强制要求。`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: service.modelId,
          baseCost: editForm.baseCost ?? service.baseCost,
          pointsCost: editForm.pointsCost ?? service.pointsCost,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, ...data.pricing } : s))
        );
      } else {
        // 本地更新
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id
              ? {
                  ...s,
                  baseCost: editForm.baseCost ?? s.baseCost,
                  pointsCost: editForm.pointsCost ?? s.pointsCost,
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        );
      }

      setEditingId(null);
      setEditForm({});
      setLastSaved(new Date());
      setWarningMessage(null);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setWarningMessage(null);
  };

  const handleToggleEnabled = async (service: any) => {
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: service.modelId,
          isEnabled: !service.isEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, isEnabled: data.pricing.isEnabled } : s
          )
        );
      } else {
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, isEnabled: !s.isEnabled } : s
          )
        );
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to toggle:", error);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.modelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || service.serviceType === filterType;
    return matchesSearch && matchesType;
  });

  const groupedServices = filteredServices.reduce((acc, service) => {
    const key = service.serviceType;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(service);
    return acc;
  }, {} as Record<string, any[]>);

  const totalServices = services.length;
  const enabledServices = services.filter((s) => s.isEnabled).length;
  const lockedServices = services.filter((s) => s.isLocked).length;

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-white">定价管理</h1>
          <p className="text-white/60 mt-1">
            管理AI服务的成本、倍率和点数设置
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <p className="text-xs text-white/40">
              上次保存: {lastSaved.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={fetchPricing}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 锁定配置警告 */}
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-500">
                锁定配置说明
              </p>
              <div className="text-xs text-white/60 space-y-1">
                <p>🔒 <span className="text-yellow-400">锁定倍率</span> - 高端模型倍率已锁定，不可修改</p>
                <p>🔐 <span className="text-red-400">强制锁定</span> - 视频类模型倍率强制20倍，禁止调低</p>
                <p className="pt-1 border-t border-white/10 mt-2">
                  <span className="text-[#00d4ff]">高端文字模型</span> 8倍倍率 | 
                  <span className="text-[#00d4ff]"> 高端绘图模型</span> 12倍倍率 | 
                  <span className="text-red-400"> 短剧视频</span> 强制20倍
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">服务总数</p>
                <p className="text-2xl font-bold text-white">{totalServices}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#0066ff]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">已启用服务</p>
                <p className="text-2xl font-bold text-green-400">
                  {enabledServices}/{totalServices}
                </p>
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
                <p className="text-sm text-white/60">锁定服务</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {lockedServices}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">平均倍率</p>
                <p className="text-2xl font-bold text-[#00d4ff]">
                  {(services.reduce((acc, s) => acc + s.multiplier, 0) / totalServices).toFixed(1)}x
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#00d4ff]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="搜索服务或模型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="服务类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="text">文本AI</SelectItem>
            <SelectItem value="code">代码AI</SelectItem>
            <SelectItem value="image">图像AI</SelectItem>
            <SelectItem value="video">视频AI</SelectItem>
            <SelectItem value="music">音乐AI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services by Type */}
      <div className="space-y-6">
        {Object.entries(groupedServices as Record<string, any[]>).map(([type, typeServices]) => {
          const config = serviceTypeConfig[type] || { icon: Type, label: type, tierLabels: {} };
          const Icon = config.icon;

          return (
            <div key={type} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0066ff]" />
                </div>
                <h2 className="text-xl font-semibold text-white">{config.label}</h2>
                <Badge variant="outline">{typeServices.length}</Badge>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-3 text-sm font-medium text-white/60">
                          模型
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-white/60">
                          基础成本 ($)
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-white/60">
                          点数成本
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-white/60">
                          倍率
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-white/60">
                          状态
                        </th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-white/60">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeServices.map((service) => {
                        const isEditing = editingId === service.id;
                        const isLocked = service.isLocked;
                        const isMandatory = service.isMandatory;

                        return (
                          <tr
                            key={service.id}
                            className={`border-b border-white/5 ${
                              !service.isEnabled ? "opacity-60" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="text-sm text-white font-medium">
                                    {service.modelName || service.modelId}
                                  </p>
                                  <code className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                                    {service.modelId}
                                  </code>
                                  {/* 锁定/强制锁定徽章 */}
                                  {isMandatory ? (
                                    <Tooltip content="⚠️ 强制锁定\n此模型倍率必须保持20倍，禁止调低！" position="right" className="bg-red-500/20 border-red-500/50 max-w-xs">
                                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-400 cursor-help">
                                        <span>🔐</span>
                                        <span className="font-bold">强制锁定</span>
                                      </span>
                                    </Tooltip>
                                  ) : isLocked ? (
                                    <Tooltip content="此模型倍率已锁定，不可修改" position="right" className="bg-yellow-500/20 border-yellow-500/50">
                                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-yellow-400 cursor-help">
                                        <span>🔒</span>
                                        <span>锁定</span>
                                      </span>
                                    </Tooltip>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.0001"
                                  min="0"
                                  value={editForm.baseCost ?? service.baseCost}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      baseCost: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-28"
                                />
                              ) : (
                                <span className="text-white">
                                  ${service.baseCost?.toFixed(4) || "0.0000"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={editForm.pointsCost ?? service.pointsCost}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      pointsCost: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="w-20"
                                />
                              ) : (
                                <span className="text-[#00d4ff]">
                                  {service.pointsCost} 点数/次
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  isMandatory
                                    ? "destructive"
                                    : isLocked
                                    ? "secondary"
                                    : service.multiplier >= 10
                                    ? "default"
                                    : service.multiplier >= 5
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
                                {service.multiplier}x
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Switch
                                checked={service.isEnabled}
                                onCheckedChange={() => handleToggleEnabled(service)}
                                disabled={isMandatory}
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSave(service)}
                                    isLoading={isSaving}
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    保存
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancel}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    取消
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(service)}
                                  disabled={isLocked}
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
      </div>

      {/* 警告弹窗 */}
      <Dialog open={!!warningMessage} onOpenChange={() => setWarningMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              倍率限制警告
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white/80">{warningMessage}</p>
            <p className="text-sm text-white/60 mt-2">
              视频类模型的倍率是系统强制要求，不得低于20倍。这是为了确保系统运营可持续性。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningMessage(null)}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredServices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <DollarSign className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-lg font-medium text-white/60">没有找到服务</h3>
          <p className="text-sm text-white/40 mt-1">
            尝试调整搜索条件
          </p>
        </div>
      )}
    </div>
  );
}
