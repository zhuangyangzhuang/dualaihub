"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PayPalCheckoutProps {
  amount: number;
  currency?: string;
  onSuccess?: (transactionId?: string) => void;
  onError?: (error: string) => void;
  onProcessing?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PayPalCheckout({
  amount,
  currency = "USD",
  onSuccess,
  onError,
  onProcessing,
  isLoading = false,
  className,
}: PayPalCheckoutProps) {
  const [localLoading, setLocalLoading] = React.useState(false);

  const handlePayPalPayment = async () => {
    setLocalLoading(true);
    onProcessing?.();

    try {
      // Simulate PayPal payment processing
      // In production, this would redirect to PayPal or use PayPal SDK
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate successful payment
      const transactionId = `PAYPAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      onSuccess?.(transactionId);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "PayPal payment failed");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-center gap-4 py-4">
        <Button
          onClick={handlePayPalPayment}
          disabled={isLoading || localLoading}
          isLoading={isLoading || localLoading}
          className="w-full bg-[#0070ba] hover:bg-[#005ea6]"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.648h6.803c2.235 0 3.955.48 5.113 1.428 1.157.948 1.632 2.342 1.413 4.148-.032.254-.08.502-.143.744H15.97a.641.641 0 0 0 .633-.54l.327-2.43a.466.466 0 0 0-.128-.408.47.47 0 0 0-.382-.157H9.419c-.237 0-.423.088-.554.263a.63.63 0 0 0-.174.427c0 .1.015.2.046.295a.822.822 0 0 0 .147.243.737.737 0 0 0 .236.17l1.336.498c.254.085.4.22.44.402.04.182-.021.383-.185.604-.164.22-.422.404-.775.553-.353.148-.807.222-1.363.222H7.076v-1.5z" />
          </svg>
          Pay with PayPal
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0a0a0f] px-2 text-white/40">Or</span>
        </div>
      </div>

      <div className="rounded-lg bg-white/5 p-4">
        <p className="mb-2 text-sm font-medium text-white">Order Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Amount</span>
          <span className="text-white">${amount.toFixed(2)} {currency}</span>
        </div>
      </div>

      <p className="text-center text-xs text-white/40">
        You will be redirected to PayPal to complete your payment securely.
      </p>
    </div>
  );
}

export default PayPalCheckout;
