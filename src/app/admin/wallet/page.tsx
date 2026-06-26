"use client";

import React, { useState } from "react";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  ArrowUpRight,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface USDTTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  txHash: string;
  status: "CONFIRMED" | "PENDING" | "FAILED";
  date: Date;
}

const mockUSDTTransactions: USDTTransaction[] = [
  { id: "usdt_001", userId: "3", userName: "David Kim", amount: 25.0, txHash: "TX1234567890ABCDEF", status: "CONFIRMED", date: new Date("2024-06-24T10:30:00") },
  { id: "usdt_002", userId: "5", userName: "Elena Rodriguez", amount: 50.0, txHash: "TX0987654321FEDCBA", status: "CONFIRMED", date: new Date("2024-06-23T15:45:00") },
  { id: "usdt_003", userId: "7", userName: "Lisa Wang", amount: 100.0, txHash: "TXABCDEF1234567890", status: "PENDING", date: new Date("2024-06-24T08:00:00") },
  { id: "usdt_004", userId: "11", userName: "Emily Davis", amount: 75.0, txHash: "TX9876543210ABCDEF", status: "CONFIRMED", date: new Date("2024-06-22T20:30:00") },
  { id: "usdt_005", userId: "4", userName: "Sarah Chen", amount: 200.0, txHash: "TX1111222233334444", status: "CONFIRMED", date: new Date("2024-06-21T12:15:00") },
  { id: "usdt_006", userId: "9", userName: "Michael Lee", amount: 30.0, txHash: "TX5555666677778888", status: "FAILED", date: new Date("2024-06-20T09:45:00") },
];

export default function WalletPage() {
  const [usdtAddress, setUsdtAddress] = useState("TRC20 Address: TXqwerty1234567890abcdefghijklmn");
  const [newAddress, setNewAddress] = useState("");
  const [showAddress, setShowAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [usdtEnabled, setUsdtEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const handleCopy = (text: string, type: "address" | "txhash") => {
    navigator.clipboard.writeText(text);
    if (type === "address") {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAddress = () => {
    if (newAddress && newAddress.trim()) {
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => {
        setUsdtAddress(newAddress);
        setNewAddress("");
        setIsEditing(false);
        setIsSaving(false);
      }, 1000);
    }
  };

  const getStatusBadgeVariant = (status: USDTTransaction["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return "success";
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Wallet Settings</h1>
        <p className="text-white/60 mt-1">
          Manage USDT TRC20 payment settings and view transactions.
        </p>
      </div>

      {/* USDT Address Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <div>
                <CardTitle className="text-lg">USDT TRC20 Address</CardTitle>
                <CardDescription>
                  Receive USDT payments from users
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={usdtEnabled ? "success" : "secondary"}>
                {usdtEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Address Display */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-white/60 mb-1">Current Address</p>
                <p className="text-sm font-mono text-white break-all">
                  {showAddress ? usdtAddress : "•".repeat(40) + usdtAddress.slice(-10)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowAddress(!showAddress)}
                >
                  {showAddress ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(usdtAddress, "address")}
                >
                  {addressCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Update Address Form */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  New USDT TRC20 Address
                </label>
                <Input
                  placeholder="Enter new TRC20 address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleSaveAddress} isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Address
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setNewAddress("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Address
            </Button>
          )}

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#00d4ff]" />
              <div>
                <p className="text-sm font-medium text-white">USDT Payments</p>
                <p className="text-xs text-white/60">
                  {usdtEnabled
                    ? "Users can pay with USDT TRC20"
                    : "USDT payments are currently disabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={usdtEnabled}
              onCheckedChange={setUsdtEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent USDT Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent USDT Transactions</CardTitle>
            <Badge variant="secondary">
              {mockUSDTTransactions.length} transactions
            </Badge>
          </div>
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
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                    TX Hash
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/60">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockUSDTTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-white text-xs font-medium">
                          {txn.userName.charAt(0)}
                        </div>
                        <span className="text-sm text-white">{txn.userName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-[#00d4ff]">
                        ₮{txn.amount.toFixed(2)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-white/60">
                          {txn.txHash.slice(0, 8)}...{txn.txHash.slice(-6)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(txn.txHash, "txhash")}
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          asChild
                        >
                          <a
                            href={`https://tronscan.org/transaction/${txn.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
