"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Calendar,
  CreditCard,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SortField = "name" | "email" | "plan" | "status" | "joined";
type SortDirection = "asc" | "desc";

interface UserData {
  id: string;
  name: string;
  email: string;
  plan: "FREE" | "BASIC" | "PRO" | "BUSINESS";
  status: "active" | "suspended" | "pending";
  joined: Date;
  lastActive: Date;
  totalSpent: number;
  creditsUsed: number;
}

const mockUsers: UserData[] = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@techcorp.io", plan: "PRO", status: "active", joined: new Date("2024-01-15"), lastActive: new Date("2024-06-24"), totalSpent: 299.99, creditsUsed: 4500 },
  { id: "2", name: "Marcus Johnson", email: "m.johnson@startup.co", plan: "BASIC", status: "active", joined: new Date("2024-02-20"), lastActive: new Date("2024-06-23"), totalSpent: 49.99, creditsUsed: 980 },
  { id: "3", name: "Elena Rodriguez", email: "elena.r@gmail.com", plan: "FREE", status: "active", joined: new Date("2024-03-10"), lastActive: new Date("2024-06-22"), totalSpent: 0, creditsUsed: 85 },
  { id: "4", name: "David Kim", email: "david.kim@enterprise.com", plan: "BUSINESS", status: "active", joined: new Date("2024-01-05"), lastActive: new Date("2024-06-24"), totalSpent: 999.99, creditsUsed: 45000 },
  { id: "5", name: "Lisa Wang", email: "lisa.wang@design.studio", plan: "PRO", status: "suspended", joined: new Date("2024-02-28"), lastActive: new Date("2024-06-01"), totalSpent: 149.99, creditsUsed: 2100 },
  { id: "6", name: "James Wilson", email: "j.wilson@agency.net", plan: "BASIC", status: "active", joined: new Date("2024-04-12"), lastActive: new Date("2024-06-24"), totalSpent: 49.99, creditsUsed: 720 },
  { id: "7", name: "Anna Martinez", email: "anna.m@creative.io", plan: "PRO", status: "active", joined: new Date("2024-01-22"), lastActive: new Date("2024-06-23"), totalSpent: 299.99, creditsUsed: 3800 },
  { id: "8", name: "Robert Taylor", email: "r.taylor@consulting.co", plan: "FREE", status: "pending", joined: new Date("2024-06-20"), lastActive: new Date("2024-06-20"), totalSpent: 0, creditsUsed: 0 },
  { id: "9", name: "Jennifer Brown", email: "j.brown@tech.io", plan: "BUSINESS", status: "active", joined: new Date("2023-11-08"), lastActive: new Date("2024-06-24"), totalSpent: 1499.99, creditsUsed: 52000 },
  { id: "10", name: "Michael Lee", email: "michael.lee@dev.com", plan: "BASIC", status: "active", joined: new Date("2024-05-01"), lastActive: new Date("2024-06-21"), totalSpent: 49.99, creditsUsed: 560 },
  { id: "11", name: "Emily Davis", email: "emily.d@gallery.art", plan: "PRO", status: "active", joined: new Date("2024-03-15"), lastActive: new Date("2024-06-24"), totalSpent: 149.99, creditsUsed: 1650 },
  { id: "12", name: "Christopher Moore", email: "c.moore@startup.io", plan: "FREE", status: "suspended", joined: new Date("2024-04-20"), lastActive: new Date("2024-05-15"), totalSpent: 0, creditsUsed: 120 },
];

const ITEMS_PER_PAGE = 8;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("joined");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const filteredAndSortedUsers = useMemo(() => {
    let users = [...mockUsers];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    users.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "plan":
          const planOrder = { BUSINESS: 0, PRO: 1, BASIC: 2, FREE: 3 };
          comparison = planOrder[a.plan] - planOrder[b.plan];
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "joined":
          comparison = a.joined.getTime() - b.joined.getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return users;
  }, [search, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getPlanBadgeVariant = (plan: UserData["plan"]) => {
    switch (plan) {
      case "BUSINESS":
        return "accent";
      case "PRO":
        return "default";
      case "BASIC":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: UserData["status"]) => {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleAction = (action: string, user: UserData) => {
    console.log(`Action ${action} on user ${user.name}`);
    // In a real app, this would call an API
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-white/60 mt-1">
            Manage user accounts, plans, and permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredAndSortedUsers.length} users
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("plan")}
                  >
                    <div className="flex items-center gap-1">
                      Plan
                      <SortIcon field="plan" />
                    </div>
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("joined")}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      <SortIcon field="joined" />
                    </div>
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-medium text-white/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-xs font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm text-white font-medium">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-white/60">{user.email}</td>
                    <td className="py-4 px-4">
                      <Badge variant={getPlanBadgeVariant(user.plan)}>{user.plan}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-white/60">
                      {user.joined.toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user.status === "suspended" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                            onClick={() => handleAction("activate", user)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                            onClick={() => handleAction("suspend", user)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={() => handleAction("delete", user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4 px-4 border-t border-white/10">
            <p className="text-sm text-white/60">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedUsers.length)} of{" "}
              {filteredAndSortedUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user account.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-xl font-medium">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedUser.name}
                  </h3>
                  <p className="text-sm text-white/60">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getPlanBadgeVariant(selectedUser.plan)}>
                      {selectedUser.plan}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <Calendar className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-xs text-white/60">Joined</p>
                    <p className="text-sm text-white">
                      {selectedUser.joined.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <Calendar className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-xs text-white/60">Last Active</p>
                    <p className="text-sm text-white">
                      {selectedUser.lastActive.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <CreditCard className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-xs text-white/60">Total Spent</p>
                    <p className="text-sm text-white">
                      ${selectedUser.totalSpent.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <User className="w-5 h-5 text-white/40" />
                  <div>
                    <p className="text-xs text-white/60">Credits Used</p>
                    <p className="text-sm text-white">
                      {selectedUser.creditsUsed.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                {selectedUser.status === "suspended" ? (
                  <Button
                    className="flex-1"
                    onClick={() => handleAction("activate", selectedUser)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate User
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAction("suspend", selectedUser)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend User
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleAction("delete", selectedUser)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
