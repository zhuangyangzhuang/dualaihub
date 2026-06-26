"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Zap, Code, Image as ImageIcon, Music, Video, Sparkles, Lock, Crown, Building } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ServiceCategory = "text" | "code" | "image" | "video" | "music";
type UserPlan = "FREE" | "BASIC" | "PRO" | "BUSINESS";

interface ModelOption {
  id: string;
  name: string;
  status: "online" | "busy" | "offline";
  pointsCost: number;
  provider: "chinese" | "global";
  tier: "free" | "basic" | "premium" | "enterprise";
  isLocked: boolean;
}

interface ServiceModels {
  text: ModelOption[];
  code: ModelOption[];
  image: ModelOption[];
  video: ModelOption[];
  music: ModelOption[];
}

// Model definitions with points cost based on locked pricing
const SERVICE_MODELS: ServiceModels = {
  text: [
    // Free tier - 1 point
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", status: "online", pointsCost: 1, provider: "global", tier: "free", isLocked: false },
    { id: "qwen-lite", name: "Qwen Lite", status: "online", pointsCost: 1, provider: "chinese", tier: "free", isLocked: false },
    { id: "kimi-basic", name: "Kimi Basic", status: "online", pointsCost: 1, provider: "chinese", tier: "free", isLocked: false },
    // Basic tier - 2 points
    { id: "doubao-pro", name: "Doubao Pro", status: "online", pointsCost: 2, provider: "chinese", tier: "basic", isLocked: false },
    { id: "qwen-plus", name: "Qwen Plus", status: "busy", pointsCost: 2, provider: "chinese", tier: "basic", isLocked: false },
    { id: "glm-4", name: "Zhipu GLM-4", status: "online", pointsCost: 2, provider: "chinese", tier: "basic", isLocked: false },
    // Premium tier - 5 points (LOCKED 8x multiplier minimum)
    { id: "gpt-4o", name: "GPT-4o", status: "online", pointsCost: 5, provider: "global", tier: "premium", isLocked: true },
    { id: "claude-3-5-sonnet", name: "Claude 3.5", status: "online", pointsCost: 5, provider: "global", tier: "premium", isLocked: true },
    { id: "kimi-20b", name: "Kimi 20B", status: "online", pointsCost: 5, provider: "chinese", tier: "premium", isLocked: true },
  ],
  code: [
    // Free tier - 1 point
    { id: "code-qwen-lite", name: "Qwen Coder Lite", status: "online", pointsCost: 1, provider: "chinese", tier: "free", isLocked: false },
    { id: "gpt-3.5-code", name: "GPT-3.5 Code", status: "online", pointsCost: 1, provider: "global", tier: "free", isLocked: false },
    // Basic tier - 3 points
    { id: "code-qwen", name: "Qwen Coder", status: "online", pointsCost: 3, provider: "chinese", tier: "basic", isLocked: false },
    { id: "kimi-code", name: "Kimi Coder", status: "busy", pointsCost: 3, provider: "chinese", tier: "basic", isLocked: false },
    // Premium tier - 6 points (LOCKED)
    { id: "gpt-4-code", name: "GPT-4 Code", status: "online", pointsCost: 6, provider: "global", tier: "premium", isLocked: true },
    { id: "claude-code", name: "Claude Code", status: "online", pointsCost: 6, provider: "global", tier: "premium", isLocked: true },
  ],
  image: [
    // Free tier - 2 points
    { id: "stable-diffusion", name: "Stable Diffusion", status: "online", pointsCost: 2, provider: "global", tier: "free", isLocked: false },
    { id: "wenxin-image", name: "文心一言", status: "busy", pointsCost: 2, provider: "chinese", tier: "free", isLocked: false },
    // Basic tier - 4 points
    { id: "dall-e", name: "DALL-E", status: "online", pointsCost: 4, provider: "global", tier: "basic", isLocked: false },
    { id: "keling-image", name: "可灵AI", status: "online", pointsCost: 4, provider: "chinese", tier: "basic", isLocked: false },
    // Premium tier - 8 points (LOCKED 12x multiplier minimum)
    { id: "midjourney", name: "Midjourney", status: "online", pointsCost: 8, provider: "global", tier: "premium", isLocked: true },
    { id: "flux-pro", name: "Flux Pro", status: "online", pointsCost: 8, provider: "global", tier: "premium", isLocked: true },
    { id: "dall-e-3", name: "DALL-E 3", status: "online", pointsCost: 8, provider: "global", tier: "premium", isLocked: true },
  ],
  video: [
    // Basic tier - 15 points
    { id: "pika", name: "Pika", status: "online", pointsCost: 15, provider: "global", tier: "basic", isLocked: false },
    { id: "runway", name: "Runway", status: "online", pointsCost: 15, provider: "global", tier: "basic", isLocked: false },
    // Premium tier - 25 points
    { id: "pika-hd", name: "Pika HD", status: "online", pointsCost: 25, provider: "global", tier: "premium", isLocked: true },
    { id: "runway-gen3", name: "Runway Gen-3", status: "online", pointsCost: 25, provider: "global", tier: "premium", isLocked: true },
    // Enterprise tier - 50 points (LOCKED 20x multiplier minimum - CANNOT BE REDUCED)
    { id: "sora", name: "Sora", status: "busy", pointsCost: 50, provider: "global", tier: "enterprise", isLocked: true },
    { id: "ai-short-drama", name: "AI短剧", status: "online", pointsCost: 50, provider: "global", tier: "enterprise", isLocked: true },
    { id: "keling-video", name: "可灵AI视频", status: "online", pointsCost: 50, provider: "chinese", tier: "enterprise", isLocked: true },
  ],
  music: [
    // Free tier - 2 points
    { id: "melody", name: "Melody", status: "busy", pointsCost: 2, provider: "chinese", tier: "free", isLocked: false },
    { id: "mermaid", name: "Mermaid", status: "online", pointsCost: 2, provider: "chinese", tier: "free", isLocked: false },
    // Basic tier - 4 points
    { id: "suno", name: "Suno", status: "online", pointsCost: 4, provider: "global", tier: "basic", isLocked: false },
    { id: "udio", name: "Udio", status: "online", pointsCost: 4, provider: "global", tier: "basic", isLocked: false },
  ],
};

const SERVICE_CREDIT_COSTS: Record<ServiceCategory, number> = {
  text: 5,
  code: 6,
  image: 8,
  video: 15,
  music: 6,
};

const serviceIcons: Record<ServiceCategory, React.ReactNode> = {
  text: <Sparkles className="h-3 w-3" />,
  code: <Code className="h-3 w-3" />,
  image: <ImageIcon className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
  music: <Music className="h-3 w-3" />,
};

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  mode?: "auto" | "manual";
  onModeChange?: (mode: "auto" | "manual") => void;
  serviceType?: ServiceCategory;
  userPlan?: UserPlan;
  className?: string;
}

const statusColors = {
  online: "bg-green-500",
  busy: "bg-yellow-500",
  offline: "bg-red-500",
};

const statusLabels = {
  online: "在线",
  busy: "忙碌",
  offline: "离线",
};

const tierLabels = {
  free: "免费",
  basic: "基础",
  premium: "高级",
  enterprise: "专业",
};

const tierIcons = {
  free: null,
  basic: null,
  premium: <Crown className="h-3 w-3" />,
  enterprise: <Building className="h-3 w-3" />,
};

const tierColors = {
  free: "",
  basic: "",
  premium: "text-purple-400 bg-purple-400/10",
  enterprise: "text-orange-400 bg-orange-400/10",
};

// Check if model is available for user's plan
function isModelAvailable(model: ModelOption, userPlan: UserPlan): boolean {
  if (userPlan === "BUSINESS") return true;
  
  const planTierMap: Record<UserPlan, string[]> = {
    FREE: ["free"],
    BASIC: ["free", "basic"],
    PRO: ["free", "basic", "premium"],
    BUSINESS: ["free", "basic", "premium", "enterprise"],
  };
  
  return planTierMap[userPlan]?.includes(model.tier) ?? false;
}

export function ModelSelector({
  value,
  onChange,
  mode = "auto",
  onModeChange,
  serviceType = "text",
  userPlan = "FREE",
  className,
}: ModelSelectorProps) {
  const selectedModel = SERVICE_MODELS[serviceType].find((m) => m.id === value);
  const isAuto = mode === "auto";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center gap-3", className)}
    >
      {/* Mode Toggle */}
      {onModeChange && (
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as "auto" | "manual")}>
          <TabsList className="h-9 bg-white/5">
            <TabsTrigger
              value="auto"
              className="data-[state=active]:bg-[#0066ff] data-[state=active]:text-white text-xs px-3"
            >
              <Zap className="mr-1 h-3 w-3" />
              智能择优
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-white text-xs px-3"
            >
              <Cpu className="mr-1 h-3 w-3" />
              手动选择
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Model Select - Only show in manual mode */}
      <AnimatePresence mode="wait">
        {mode === "manual" ? (
          <motion.div
            key="model-select"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="w-[220px] bg-white/5 border-white/10">
                <SelectValue placeholder="Select model">
                  {selectedModel ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          statusColors[selectedModel.status]
                        )}
                      />
                      <span>{selectedModel.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedModel.pointsCost} 点
                      </Badge>
                      {selectedModel.tier === "premium" && (
                        <Crown className="h-3 w-3 text-purple-400" />
                      )}
                      {selectedModel.tier === "enterprise" && (
                        <Building className="h-3 w-3 text-orange-400" />
                      )}
                    </div>
                  ) : (
                    <span>Select model</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0f] border-white/10">
                {/* Auto Option */}
                <SelectItem value="auto" className="focus:bg-white/10">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#00d4ff]" />
                    <span>智能择优 (自动选择最佳模型)</span>
                  </div>
                </SelectItem>

                <SelectSeparator />

                {/* Models grouped by tier */}
                {["free", "basic", "premium", "enterprise"].map((tier) => {
                  const tierModels = SERVICE_MODELS[serviceType].filter((m) => m.tier === tier);
                  if (tierModels.length === 0) return null;
                  
                  return (
                    <SelectGroup key={tier}>
                      <SelectLabel className={cn("flex items-center gap-2", tierColors[tier as keyof typeof tierColors])}>
                        {tierIcons[tier as keyof typeof tierIcons]}
                        {tierLabels[tier as keyof typeof tierLabels]}
                        {tier === "premium" && <span className="text-xs">(Pro+)</span>}
                        {tier === "enterprise" && <span className="text-xs">(Business)</span>}
                      </SelectLabel>
                      {tierModels.map((model) => {
                        const isAvailable = isModelAvailable(model, userPlan);
                        const isLockedForUser = !isAvailable;
                        
                        return (
                          <SelectItem
                            key={model.id}
                            value={model.id}
                            className="focus:bg-white/10"
                            disabled={model.status === "offline" || isLockedForUser}
                          >
                            <div className="flex items-center justify-between gap-4 w-full">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    statusColors[model.status]
                                  )}
                                />
                                <span>{model.name}</span>
                                {isLockedForUser && (
                                  <Lock className="h-3 w-3 text-red-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {model.pointsCost} 点
                                </Badge>
                                <span className="text-xs text-white/40">
                                  {statusLabels[model.status]}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  );
                })}

                {/* Upgrade prompt for locked models */}
                {userPlan === "FREE" && (
                  <SelectSeparator />
                )}
                {userPlan === "FREE" && (
                  <div className="px-4 py-2 text-xs text-white/50">
                    🔒 升级会员以解锁更多高级模型
                  </div>
                )}
              </SelectContent>
            </Select>
          </motion.div>
        ) : (
          <motion.div
            key="auto-info"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20"
          >
            <Zap className="h-4 w-4 text-[#00d4ff]" />
            <span className="text-sm text-white/70">
              系统将自动选择最佳模型 (约 {SERVICE_CREDIT_COSTS[serviceType]} 点)
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { SERVICE_MODELS, SERVICE_CREDIT_COSTS };

export type { ServiceCategory };