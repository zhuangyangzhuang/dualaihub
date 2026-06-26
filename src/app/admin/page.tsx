"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  {
    title: "Total Users",
    value: "12,847",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "#0066ff",
  },
  {
    title: "Active Users",
    value: "8,234",
    change: "+8.2%",
    trend: "up",
    icon: UserCheck,
    color: "#00d4ff",
  },
  {
    title: "Revenue",
    value: "$48,250",
    change: "+15.3%",
    trend: "up",
    icon: DollarSign,
    color: "#22c55e",
  },
  {
    title: "API Calls",
    value: "1.2M",
    change: "+23.1%",
    trend: "up",
    icon: Activity,
    color: "#a855f7",
  },
];

const recentRegistrations = [
  { name: "Sarah Chen", email: "sarah.chen@techcorp.io", plan: "PRO", date: "2 min ago" },
  { name: "Marcus Johnson", email: "m.johnson@startup.co", plan: "BASIC", date: "5 min ago" },
  { name: "Elena Rodriguez", email: "elena.r@gmail.com", plan: "FREE", date: "12 min ago" },
  { name: "David Kim", email: "david.kim@enterprise.com", plan: "BUSINESS", date: "18 min ago" },
  { name: "Lisa Wang", email: "lisa.wang@design.studio", plan: "PRO", date: "25 min ago" },
];

const quickActions = [
  {
    title: "Manage Users",
    description: "View, edit, and manage user accounts",
    icon: Users,
    href: "/admin/users",
    color: "#0066ff",
  },
  {
    title: "View Transactions",
    description: "Review and export transaction history",
    icon: CreditCard,
    href: "/admin/transactions",
    color: "#00d4ff",
  },
];

export default function AdminDashboard() {
  const [chartHover, setChartHover] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/60 mt-1">Welcome back, here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:border-white/10 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === "up" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="hover:border-white/10 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] relative">
                {/* Placeholder Chart */}
                <div className="absolute inset-0 flex items-end justify-between gap-2 px-4">
                  {[40, 65, 45, 80, 55, 70, 85, 60, 75, 90, 70, 95].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-[#0066ff]/20 to-[#0066ff]/5 rounded-t-lg hover:from-[#0066ff]/30 hover:to-[#0066ff]/10 transition-colors cursor-pointer"
                      onMouseEnter={() => setChartHover(i)}
                      onMouseLeave={() => setChartHover(null)}
                    />
                  ))}
                </div>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-white/40">
                  <span>$50k</span>
                  <span>$40k</span>
                  <span>$30k</span>
                  <span>$20k</span>
                  <span>$10k</span>
                  <span>$0</span>
                </div>
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-white/40">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>
              {chartHover !== null && (
                <div className="absolute top-4 right-4 bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-xs text-white/60">Month {chartHover + 1}</p>
                  <p className="text-sm font-medium text-white">
                    ${(Math.random() * 40 + 10).toFixed(1)}k
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="hover:border-white/10 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <action.icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{action.title}</p>
                      <p className="text-xs text-white/60">{action.description}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Registrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="hover:border-white/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Registrations</CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((user, index) => (
                    <motion.tr
                      key={user.email}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-xs font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-sm text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-white/60">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            user.plan === "BUSINESS"
                              ? "accent"
                              : user.plan === "PRO"
                              ? "default"
                              : user.plan === "BASIC"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {user.plan}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-white/60">{user.date}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
