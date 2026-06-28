"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Coins,
  Calendar,
  History,
  Sparkles,
  Type,
  Code2,
  Image,
  Music,
  Video,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuotaStore, getRemainingDailyCredits } from "@/store/quotaStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentActivity {
  id: string;
  type: "text" | "code" | "image" | "music" | "video";
  prompt: string;
  model: string;
  status: "completed" | "failed" | "pending";
  date: string;
  creditsUsed: number;
}

const mockRecentActivity: RecentActivity[] = [
  {
    id: "1",
    type: "text",
    prompt: "Write a blog post about AI advancements",
    model: "GPT-4o",
    status: "completed",
    date: "2 hours ago",
    creditsUsed: 5,
  },
  {
    id: "2",
    type: "image",
    prompt: "Futuristic cityscape at sunset",
    model: "DALL-E 3",
    status: "completed",
    date: "4 hours ago",
    creditsUsed: 10,
  },
  {
    id: "3",
    type: "code",
    prompt: "React component for user dashboard",
    model: "Claude 3 Opus",
    status: "failed",
    date: "6 hours ago",
    creditsUsed: 0,
  },
  {
    id: "4",
    type: "music",
    prompt: "Upbeat lo-fi background music",
    model: "Suno AI",
    status: "completed",
    date: "Yesterday",
    creditsUsed: 15,
  },
];

const quickActions = [
  { name: "New Text", href: "/dashboard/text", icon: Type, color: "from-blue-500 to-cyan-500" },
  { name: "New Code", href: "/dashboard/code", icon: Code2, color: "from-purple-500 to-pink-500" },
  { name: "New Image", href: "/dashboard/image", icon: Image, color: "from-orange-500 to-red-500" },
  { name: "New Music", href: "/dashboard/music", icon: Music, color: "from-green-500 to-emerald-500" },
  { name: "New Video", href: "/dashboard/video", icon: Video, color: "from-[#0066ff] to-[#00d4ff]" },
];

const activityIcons = {
  text: Type,
  code: Code2,
  image: Image,
  music: Music,
  video: Video,
};

const activityColors = {
  text: "text-blue-400 bg-blue-400/10",
  code: "text-purple-400 bg-purple-400/10",
  image: "text-orange-400 bg-orange-400/10",
  music: "text-green-400 bg-green-400/10",
  video: "text-[#00d4ff] bg-[#00d4ff]/10",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { credits, points, dailyUsed, videoUsage, plan, checkQuota, isLoading } = useQuotaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkQuota();
  }, [checkQuota]);

  const remainingCredits = mounted
    ? getRemainingDailyCredits({ credits, points, dailyUsed, videoUsage, plan, lastReset: null, videoReset: null, isLoading, error: null })
    : 0;

  const dailyQuota = plan === "FREE" ? 50 : plan === "BASIC" ? 500 : plan === "PRO" ? 2000 : Infinity;
  const usagePercentage = Math.round((dailyUsed / dailyQuota) * 100);
  const historyCount = 127;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">
          {getGreeting()}, {session?.user?.name || "Creator"} 👋
        </h1>
        <p className="mt-2 text-white/60">
          Welcome back to your AI workspace. What would you like to create today?
        </p>
      </motion.div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Credits Remaining */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Credits Remaining</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      remainingCredits.toLocaleString()
                    )}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Daily quota: {dailyQuota}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>Used today</span>
                  <span>{usagePercentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercentage}%` }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className={cn(
                      "h-full rounded-full",
                      usagePercentage > 80
                        ? "bg-gradient-to-r from-red-500 to-red-400"
                        : usagePercentage > 50
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                        : "bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Today&apos;s Usage</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      dailyUsed.toLocaleString()
                    )}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    credits consumed today
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/40" />
                <span className="text-xs text-white/40">
                  Resets at midnight
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generation History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Total Generations</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {historyCount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    all-time creations
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <History className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/dashboard/history"
                  className="inline-flex items-center gap-1 text-xs text-[#00d4ff] hover:underline"
                >
                  View all generations
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <Link href={action.href}>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-auto flex-col py-4 gap-3 bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10",
                    `hover:shadow-lg hover:shadow-${action.color.split(" ")[0]}/20`
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                      action.color
                    )}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {action.name}
                  </span>
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-white">
                Recent Activity
              </CardTitle>
              <Link href="/dashboard/history">
                <Button variant="ghost" size="sm" className="text-[#00d4ff]">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentActivity.map((activity, index) => {
                  const Icon = activityIcons[activity.type];
                  const colorClass = activityColors[activity.type];

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          colorClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {activity.prompt}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/40">
                            {activity.model}
                          </span>
                          <span className="text-xs text-white/30">•</span>
                          <span className="text-xs text-white/40">
                            {activity.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.status === "completed" && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {activity.creditsUsed} credits
                          </Badge>
                        )}
                        {activity.status === "failed" && (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                        {activity.status === "pending" && (
                          <Badge variant="secondary" className="text-xs">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-[#0066ff]/30 bg-gradient-to-r from-[#0066ff]/10 to-[#00d4ff]/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#00d4ff]">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{plan} Plan</p>
                      <p className="text-sm text-white/60">Your current subscription</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] text-white">
                    Active
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Daily Credits</span>
                    <span className="text-white font-medium">{dailyQuota}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Available Models</span>
                    <span className="text-white font-medium">All Models</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Priority Support</span>
                    <span className="text-white font-medium">Included</span>
                  </div>
                </div>

                <Link href="/dashboard/quota">
                  <Button className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
