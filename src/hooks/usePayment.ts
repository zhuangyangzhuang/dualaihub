"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

interface PaymentRequest {
  planId?: string;
  interval?: "monthly" | "yearly";
  credits?: number;
  method: "stripe" | "paypal" | "usdt";
}

interface PaymentResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = useCallback(async (request: PaymentRequest): Promise<PaymentResponse> => {
    setIsLoading(true);
    try {
      let response: Response;
      let data: PaymentResponse;

      if (request.method === "stripe") {
        response = await fetch("/api/payments/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        data = await response.json();
      } else if (request.method === "paypal") {
        toast.success("PayPal checkout coming soon");
        setIsLoading(false);
        return { success: false, error: "PayPal not configured" };
      } else {
        toast.success("USDT checkout - copy wallet address");
        const addressResponse = await fetch("/api/payments/usdt/address");
        const addressData = await addressResponse.json();
        return { success: true, url: addressData.address };
      }

      if (!response.ok) throw new Error(data.error || "Payment failed");
      
      if (data.url) {
        window.location.href = data.url;
      }
      
      return data;
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmUSDTPayment = useCallback(async (transactionHash: string, amount: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/usdt/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionHash, amount }),
      });
      const data = await response.json();
      
      if (!response.ok || !data.confirmed) {
        throw new Error(data.error || "Transaction confirmation failed");
      }
      
      toast.success(`Payment confirmed! ${data.creditsAdded} credits added.`);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Transaction confirmation failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getWalletAddress = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/payments/usdt/address");
      const data = await response.json();
      return data.address || null;
    } catch (err) {
      console.error("Failed to get wallet address:", err);
      return null;
    }
  }, []);

  return {
    isLoading,
    createCheckoutSession,
    confirmUSDTPayment,
    getWalletAddress,
  };
}
