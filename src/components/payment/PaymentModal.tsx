"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StripeCheckout } from "@/components/payment/StripeCheckout";
import { PayPalCheckout } from "@/components/payment/PayPalCheckout";
import { USDTCheckout } from "@/components/payment/USDTCheckout";
import { cn } from "@/lib/utils";

export type PaymentMethod = "stripe" | "paypal" | "usdt";

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planDescription?: string;
  price: number;
  credits: number | string;
  billingPeriod: "month" | "year";
  onSuccess?: (method: PaymentMethod, transactionId?: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

type PaymentState = "idle" | "processing" | "success" | "error";

export function PaymentModal({
  isOpen,
  onClose,
  planName,
  planDescription,
  price,
  credits,
  billingPeriod,
  onSuccess,
  onError,
  className,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>("stripe");
  const [paymentState, setPaymentState] = React.useState<PaymentState>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [transactionId, setTransactionId] = React.useState<string>("");

  const handlePaymentSuccess = (txId?: string) => {
    setPaymentState("success");
    setTransactionId(txId || "");
    onSuccess?.(selectedMethod, txId);
  };

  const handlePaymentError = (error: string) => {
    setPaymentState("error");
    setErrorMessage(error);
    onError?.(error);
  };

  const handleProcessing = () => {
    setPaymentState("processing");
  };

  const handleClose = () => {
    setPaymentState("idle");
    setErrorMessage("");
    setTransactionId("");
    onClose();
  };

  const renderPaymentContent = () => {
    if (paymentState === "success") {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">Payment Successful!</h3>
          <p className="mb-4 text-sm text-white/60">
            Your payment has been processed successfully.
          </p>
          {transactionId && (
            <p className="mb-6 text-xs text-white/40">
              Transaction ID: {transactionId}
            </p>
          )}
          <Button onClick={handleClose} variant="default">
            Done
          </Button>
        </div>
      );
    }

    if (paymentState === "error") {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">Payment Failed</h3>
          <p className="mb-4 text-sm text-white/60">{errorMessage}</p>
          <Button onClick={() => setPaymentState("idle")} variant="default">
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <>
        <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as PaymentMethod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stripe" className="text-xs sm:text-sm">
              Credit Card
            </TabsTrigger>
            <TabsTrigger value="paypal" className="text-xs sm:text-sm">
              PayPal
            </TabsTrigger>
            <TabsTrigger value="usdt" className="text-xs sm:text-sm">
              USDT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe" className="mt-4">
            <StripeCheckout
              amount={price}
              currency="USD"
              onSuccess={(txId) => handlePaymentSuccess(txId)}
              onError={handlePaymentError}
              onProcessing={handleProcessing}
              isLoading={paymentState === "processing"}
            />
          </TabsContent>

          <TabsContent value="paypal" className="mt-4">
            <PayPalCheckout
              amount={price}
              currency="USD"
              onSuccess={(txId) => handlePaymentSuccess(txId)}
              onError={handlePaymentError}
              onProcessing={handleProcessing}
              isLoading={paymentState === "processing"}
            />
          </TabsContent>

          <TabsContent value="usdt" className="mt-4">
            <USDTCheckout
              amount={price}
              credits={credits}
              onSuccess={(txId) => handlePaymentSuccess(txId)}
              onError={handlePaymentError}
              onProcessing={handleProcessing}
              isLoading={paymentState === "processing"}
            />
          </TabsContent>
        </Tabs>

        {paymentState === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#0a0a0f]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <svg
                className="h-8 w-8 animate-spin text-[#0066ff]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm text-white/60">Processing payment...</p>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            Subscribe to <span className="text-[#0066ff]">{planName}</span>
          </DialogTitle>
          {planDescription && (
            <DialogDescription>{planDescription}</DialogDescription>
          )}
        </DialogHeader>

        {/* Plan Summary */}
        <div className="mb-6 rounded-xl bg-gradient-to-br from-[#0066ff]/10 to-[#00d4ff]/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Plan</p>
              <p className="font-semibold text-white">{planName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Price</p>
              <p className="text-xl font-bold text-white">
                ${price.toFixed(2)}
                <span className="text-sm font-normal text-white/60">/{billingPeriod}</span>
              </p>
            </div>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="text-sm text-white/60">Credits</p>
            <p className="font-semibold text-[#00d4ff]">
              {typeof credits === "number" ? credits.toLocaleString() : credits} credits
            </p>
          </div>
        </div>

        {renderPaymentContent()}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;
