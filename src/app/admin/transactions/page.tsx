"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TransactionType = "SUBSCRIPTION" | "ONE_TIME" | "USDT" | "REFUND";
type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: string;
  date: Date;
  description: string;
}

const mockTransactions: Transaction[] = [
  { id: "txn_001", userId: "1", userName: "Sarah Chen", userEmail: "sarah.chen@techcorp.io", type: "SUBSCRIPTION", amount: 49.99, currency: "USD", status: "COMPLETED", paymentMethod: "Stripe", date: new Date("2024-06-24T10:30:00"), description: "PRO Plan - Monthly" },
  { id: "txn_002", userId: "2", userName: "Marcus Johnson", userEmail: "m.johnson@startup.co", type: "ONE_TIME", amount: 19.99, currency: "USD", status: "COMPLETED", paymentMethod: "PayPal", date: new Date("2024-06-23T15:45:00"), description: "500 Credits Top-up" },
  { id: "txn_003", userId: "3", userName: "David Kim", userEmail: "david.kim@enterprise.com", type: "SUBSCRIPTION", amount: 299.99, currency: "USD", status: "COMPLETED", paymentMethod: "Stripe", date: new Date("2024-06-22T09:00:00"), description: "BUSINESS Plan - Monthly" },
  { id: "txn_004", userId: "4", userName: "Elena Rodriguez", userEmail: "elena.r@gmail.com", type: "USDT", amount: 25.00, currency: "USDT", status: "COMPLETED", paymentMethod: "USDT TRC20", date: new Date("2024-06-21T18:20:00"), description: "1000 Credits Top-up" },
  { id: "txn_005", userId: "5", userName: "Jennifer Brown", userEmail: "j.brown@tech.io", type: "REFUND", amount: 49.99, currency: "USD", status: "REFUNDED", paymentMethod: "Stripe", date: new Date("2024-06-20T11:15:00"), description: "Refund - PRO Plan" },
  { id: "txn_006", userId: "6", userName: "James Wilson", userEmail: "j.wilson@agency.net", type: "SUBSCRIPTION", amount: 19.99, currency: "USD", status: "COMPLETED", paymentMethod: "Stripe", date: new Date("2024-06-19T14:30:00"), description: "BASIC Plan - Monthly" },
  { id: "txn_007", userId: "7", userName: "Lisa Wang", userEmail: "lisa.wang@design.studio", type: "USDT", amount: 50.00, currency: "USDT", status: "PENDING", paymentMethod: "USDT TRC20", date: new Date("2024-06-24T08:00:00"), description: "2000 Credits Top-up" },
  { id: "txn_008", userId: "8", userName: "Robert Taylor", userEmail: "r.taylor@consulting.co", type: "ONE_TIME", amount: 9.99, currency: "USD", status: "FAILED", paymentMethod: "PayPal", date: new Date("2024-06-18T16:45:00"), description: "100 Credits Top-up" },
  { id: "txn_009", userId: "9", userName: "Anna Martinez", userEmail: "anna.m@creative.io", type: "SUBSCRIPTION", amount: 49.99, currency: "USD", status: "COMPLETED", paymentMethod: "Stripe", date: new Date("2024-06-17T10:00:00"), description: "PRO Plan - Monthly" },
  { id: "txn_010", userId: "10", userName: "Michael Lee", userEmail: "michael.lee@dev.com", type: "ONE_TIME", amount: 99.99, currency: "USD", status: "COMPLETED", paymentMethod: "Stripe", date: new Date("2024-06-16T13:20:00"), description: "2500 Credits Top-up" },
  { id: "txn_011", userId: "11", userName: "Emily Davis", userEmail: "emily.d@gallery.art", type: "USDT", amount: 100.00, currency: "USDT", status: "COMPLETED", paymentMethod: "USDT TRC20", date: new Date("2024-06-15T20:30:00"), description: "5000 Credits Top-up" },
  { id: "txn_012", userId: "12", userName: "Christopher Moore", userEmail: "c.moore@startup.io", type: "SUBSCRIPTION", amount: 19.99, currency: "USD", status: "COMPLETED", paymentMethod: "PayPal", date: new Date("2024-06-14T09:45:00"), description: "BASIC Plan - Monthly" },
];

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<"date" | "amount" | "user">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTransactions = useMemo(() => {
    let transactions = [...mockTransactions];

    // Type filter
    if (typeFilter !== "ALL") {
      transactions = transactions.filter((t) => t.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "ALL") {
      transactions = transactions.filter((t) => t.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      transactions = transactions.filter((t) => t.date >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      transactions = transactions.filter((t) => t.date <= toDate);
    }

    // Sort
    transactions.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "user":
          comparison = a.userName.localeCompare(b.userName);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return transactions;
  }, [typeFilter, statusFilter, dateFrom, dateTo, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: "date" | "amount" | "user") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: "date" | "amount" | "user" }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "SUBSCRIPTION":
        return RefreshCw;
      case "ONE_TIME":
        return ArrowUpRight;
      case "USDT":
        return CreditCard;
      case "REFUND":
        return ArrowDownLeft;
    }
  };

  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      case "REFUNDED":
        return "outline";
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "User", "Email", "Type", "Amount", "Currency", "Status", "Payment Method", "Date", "Description"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((t) =>
        [
          t.id,
          t.userName,
          t.userEmail,
          t.type,
          t.amount,
          t.currency,
          t.status,
          t.paymentMethod,
          t.date.toISOString(),
          `"${t.description}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters = typeFilter !== "ALL" || statusFilter !== "ALL" || dateFrom || dateTo;

  // Calculate totals
  const totalRevenue = filteredTransactions
    .filter((t) => t.status === "COMPLETED" && t.type !== "REFUND")
    .reduce((sum, t) => sum + (t.currency === "USDT" ? t.amount * 1 : t.amount), 0);
  const totalRefunds = filteredTransactions
    .filter((t) => t.status === "REFUNDED")
    .reduce((sum, t) => sum + (t.currency === "USDT" ? t.amount * 1 : t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-white/60 mt-1">
            View and manage all payment transactions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Transactions</p>
                <p className="text-2xl font-bold text-white">
                  {filteredTransactions.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#0066ff]/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#0066ff]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Revenue (USD)</p>
                <p className="text-2xl font-bold text-green-400">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Refunds</p>
                <p className="text-2xl font-bold text-red-400">
                  ${totalRefunds.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">Filters:</span>
            </div>

            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v as TransactionType | "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                <SelectItem value="ONE_TIME">One-time</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as TransactionStatus | "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/40" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-[150px]"
              />
              <span className="text-white/40">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-[150px]"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}

            <Badge variant="secondary" className="ml-auto">
              {filteredTransactions.length} transactions
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                    Transaction
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("user")}
                  >
                    <div className="flex items-center gap-1">
                      User
                      <SortIcon field="user" />
                    </div>
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                    Type
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                    Status
                  </th>
                  <th
                    className="text-left py-4 px-4 text-xs font-medium text-white/60 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-medium text-white/60">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((txn) => {
                  const TypeIcon = getTypeIcon(txn.type);
                  return (
                    <tr
                      key={txn.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              txn.type === "REFUND"
                                ? "bg-red-500/20"
                                : txn.type === "USDT"
                                ? "bg-[#00d4ff]/20"
                                : "bg-[#0066ff]/20"
                            }`}
                          >
                            <TypeIcon
                              className={`w-4 h-4 ${
                                txn.type === "REFUND"
                                  ? "text-red-400"
                                  : txn.type === "USDT"
                                  ? "text-[#00d4ff]"
                                  : "text-[#0066ff]"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {txn.id}
                            </p>
                            <p className="text-xs text-white/60 truncate max-w-[200px]">
                              {txn.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm text-white">{txn.userName}</p>
                          <p className="text-xs text-white/60">{txn.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">
                          {txn.type.charAt(0) + txn.type.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p
                          className={`text-sm font-medium ${
                            txn.type === "REFUND" ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {txn.type === "REFUND" ? "-" : "+"}
                          {txn.currency === "USDT" ? "₮" : "$"}
                          {txn.amount.toFixed(2)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={getStatusBadgeVariant(txn.status)}>
                          {txn.status.charAt(0) + txn.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-white/60">
                        {txn.date.toLocaleDateString()}{" "}
                        <span className="text-white/40">
                          {txn.date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-white/60">
                        {txn.paymentMethod}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4 px-4 border-t border-white/10">
            <p className="text-sm text-white/60">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{" "}
              {filteredTransactions.length} transactions
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
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
    </div>
  );
}
