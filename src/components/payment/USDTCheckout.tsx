"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Copy, Check, Wallet } from "lucide-react";

export interface USDTCheckoutProps {
  amount: number;
  credits: number | string;
  walletAddress?: string;
  network?: "TRC20" | "ERC20";
  onSuccess?: (transactionId?: string) => void;
  onError?: (error: string) => void;
  onProcessing?: () => void;
  isLoading?: boolean;
  className?: string;
}

type CheckoutStep = "qr" | "confirm";

export function USDTCheckout({
  amount,
  credits,
  walletAddress = "TRC20_WALLET_ADDRESS_PLACEHOLDER",
  network = "TRC20",
  onSuccess,
  onError,
  onProcessing,
  isLoading = false,
  className,
}: USDTCheckoutProps) {
  const [step, setStep] = React.useState<CheckoutStep>("qr");
  const [transactionHash, setTransactionHash] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [hashError, setHashError] = React.useState("");

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = walletAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateTransactionHash = (hash: string): boolean => {
    // TRC20 transaction hashes are typically 64 characters (without 0x prefix)
    // ERC20 transaction hashes are typically 66 characters (with 0x prefix)
    const cleanHash = hash.trim();
    if (network === "TRC20") {
      return /^[a-fA-F0-9]{64}$/.test(cleanHash);
    } else {
      return /^0x[a-fA-F0-9]{64}$/.test(cleanHash);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionHash.trim()) {
      setHashError("Transaction hash is required");
      return;
    }

    if (!validateTransactionHash(transactionHash)) {
      setHashError(
        network === "TRC20"
          ? "Invalid TRC20 transaction hash format"
          : "Invalid ERC20 transaction hash format"
      );
      return;
    }

    setHashError("");
    setLocalLoading(true);
    onProcessing?.();

    try {
      // Simulate transaction verification
      // In production, this would call your backend to verify the transaction on-chain
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate successful verification
      const transactionId = `USDT_${network}_${transactionHash.slice(0, 16)}...`;
      onSuccess?.(transactionId);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Transaction verification failed"
      );
    } finally {
      setLocalLoading(false);
    }
  };

  // Generate a simple QR code placeholder (in production, use a QR code library)
  const QRCodePlaceholder = () => (
    <div className="flex items-center justify-center">
      <div className="relative h-48 w-48 rounded-lg bg-white p-2">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* QR Code pattern - simplified representation */}
          <rect x="5" y="5" width="25" height="25" fill="black" />
          <rect x="10" y="10" width="15" height="15" fill="white" />
          <rect x="13" y="13" width="9" height="9" fill="black" />

          <rect x="70" y="5" width="25" height="25" fill="black" />
          <rect x="75" y="10" width="15" height="15" fill="white" />
          <rect x="78" y="13" width="9" height="9" fill="black" />

          <rect x="5" y="70" width="25" height="25" fill="black" />
          <rect x="10" y="75" width="15" height="15" fill="white" />
          <rect x="13" y="78" width="9" height="9" fill="black" />

          {/* Data pattern */}
          <rect x="35" y="5" width="5" height="5" fill="black" />
          <rect x="45" y="5" width="5" height="5" fill="black" />
          <rect x="55" y="5" width="5" height="5" fill="black" />
          <rect x="35" y="15" width="5" height="5" fill="black" />
          <rect x="50" y="15" width="5" height="5" fill="black" />
          <rect x="60" y="15" width="5" height="5" fill="black" />

          <rect x="5" y="35" width="5" height="5" fill="black" />
          <rect x="15" y="35" width="5" height="5" fill="black" />
          <rect x="25" y="35" width="5" height="5" fill="black" />
          <rect x="35" y="35" width="5" height="5" fill="black" />
          <rect x="45" y="35" width="5" height="5" fill="black" />
          <rect x="55" y="35" width="5" height="5" fill="black" />
          <rect x="65" y="35" width="5" height="5" fill="black" />
          <rect x="75" y="35" width="5" height="5" fill="black" />
          <rect x="85" y="35" width="5" height="5" fill="black" />
          <rect x="95" y="35" width="5" height="5" fill="black" />

          <rect x="35" y="45" width="5" height="5" fill="black" />
          <rect x="50" y="45" width="5" height="5" fill="black" />
          <rect x="70" y="45" width="5" height="5" fill="black" />
          <rect x="90" y="45" width="5" height="5" fill="black" />

          <rect x="35" y="55" width="5" height="5" fill="black" />
          <rect x="45" y="55" width="5" height="5" fill="black" />
          <rect x="60" y="55" width="5" height="5" fill="black" />
          <rect x="80" y="55" width="5" height="5" fill="black" />

          <rect x="35" y="65" width="5" height="5" fill="black" />
          <rect x="55" y="65" width="5" height="5" fill="black" />
          <rect x="70" y="65" width="5" height="5" fill="black" />
          <rect x="85" y="65" width="5" height="5" fill="black" />

          <rect x="35" y="75" width="5" height="5" fill="black" />
          <rect x="45" y="75" width="5" height="5" fill="black" />
          <rect x="55" y="75" width="5" height="5" fill="black" />
          <rect x="70" y="75" width="5" height="5" fill="black" />
          <rect x="85" y="75" width="5" height="5" fill="black" />

          <rect x="35" y="85" width="5" height="5" fill="black" />
          <rect x="50" y="85" width="5" height="5" fill="black" />
          <rect x="65" y="85" width="5" height="5" fill="black" />
          <rect x="80" y="85" width="5" height="5" fill="black" />
          <rect x="95" y="85" width="5" height="5" fill="black" />

          <rect x="35" y="95" width="5" height="5" fill="black" />
          <rect x="55" y="95" width="5" height="5" fill="black" />
          <rect x="75" y="95" width="5" height="5" fill="black" />
          <rect x="90" y="95" width="5" height="5" fill="black" />
        </svg>
      </div>
    </div>
  );

  if (step === "confirm") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="rounded-lg bg-white/5 p-4">
          <p className="mb-2 text-sm font-medium text-white">Transaction Hash</p>
          <p className="mb-3 text-xs text-white/60">
            Please enter the TRON (TRC20) transaction hash after sending USDT
          </p>
          <Input
            type="text"
            placeholder="Enter transaction hash (64 characters)"
            value={transactionHash}
            onChange={(e) => {
              setTransactionHash(e.target.value);
              if (hashError) setHashError("");
            }}
            className={cn(hashError && "border-red-500")}
            disabled={isLoading || localLoading}
          />
          {hashError && <p className="mt-1 text-xs text-red-500">{hashError}</p>}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep("qr")}
            disabled={isLoading || localLoading}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isLoading || localLoading}
            isLoading={isLoading || localLoading}
            className="flex-1 bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
          >
            Confirm Payment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Amount Info */}
      <div className="rounded-lg bg-gradient-to-br from-[#0066ff]/10 to-[#00d4ff]/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Amount to send</p>
            <p className="text-2xl font-bold text-white">${amount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">You&apos;ll receive</p>
            <p className="text-lg font-semibold text-[#00d4ff]">
              {typeof credits === "number" ? credits.toLocaleString() : credits} credits
            </p>
          </div>
        </div>
      </div>

      {/* Network Badge */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="text-[#00d4ff]">
          <Wallet className="mr-1 h-3 w-3" />
          {network} Network
        </Badge>
      </div>

      {/* QR Code */}
      <QRCodePlaceholder />

      {/* Wallet Address */}
      <div className="space-y-2">
        <Label className="text-white/80">Wallet Address</Label>
        <div className="relative">
          <Input
            type="text"
            value={walletAddress}
            readOnly
            className="pr-10 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyAddress}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-white/10"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-white/60" />
            )}
          </Button>
        </div>
        {copied && (
          <p className="text-xs text-green-500">Address copied to clipboard!</p>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-white/5 p-3">
        <p className="text-xs text-white/60">
          <strong className="text-white">Instructions:</strong>
        </p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-white/60">
          <li>Copy the wallet address above</li>
          <li>Send exactly ${amount.toFixed(2)} in USDT ({network})</li>
          <li>Click &quot;I&apos;ve Paid&quot; below</li>
          <li>Enter your transaction hash to confirm</li>
        </ol>
      </div>

      {/* Confirm Button */}
      <Button
        type="button"
        onClick={() => setStep("confirm")}
        disabled={isLoading || localLoading}
        isLoading={isLoading || localLoading}
        className="w-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
      >
        I&apos;ve Paid
      </Button>

      <p className="text-center text-xs text-white/40">
        USDT payments are processed manually. Confirmation may take up to 24 hours.
      </p>
    </div>
  );
}

// Badge variant for outline
function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "accent" | "destructive";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/30",
        variant === "outline" && "border border-white/20 text-white/80",
        variant === "accent" && "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30",
        variant === "destructive" && "bg-red-600/20 text-red-400 border border-red-600/30",
        className
      )}
    >
      {children}
    </div>
  );
}

export default USDTCheckout;
