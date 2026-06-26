"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface StripeCheckoutProps {
  amount: number;
  currency?: string;
  onSuccess?: (transactionId?: string) => void;
  onError?: (error: string) => void;
  onProcessing?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface CardFields {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export function StripeCheckout({
  amount,
  currency = "USD",
  onSuccess,
  onError,
  onProcessing,
  isLoading = false,
  className,
}: StripeCheckoutProps) {
  const [cardFields, setCardFields] = React.useState<CardFields>({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });
  const [localLoading, setLocalLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<CardFields>>({});

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: keyof CardFields, value: string) => {
    let formattedValue = value;

    if (field === "number") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cvc") {
      formattedValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    }

    setCardFields((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CardFields> = {};

    if (!cardFields.name.trim()) {
      newErrors.name = "Name is required";
    }

    const cleanCardNumber = cardFields.number.replace(/\s/g, "");
    if (!cleanCardNumber || cleanCardNumber.length < 13) {
      newErrors.number = "Valid card number is required";
    }

    if (!cardFields.expiry || cardFields.expiry.length < 5) {
      newErrors.expiry = "Valid expiry is required";
    }

    if (!cardFields.cvc || cardFields.cvc.length < 3) {
      newErrors.cvc = "Valid CVC is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLocalLoading(true);
    onProcessing?.();

    try {
      // Simulate Stripe payment processing
      // In production, this would call your backend to create a payment intent
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate successful payment
      const transactionId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      onSuccess?.(transactionId);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="stripe-name" className="text-white/80">
          Cardholder Name
        </Label>
        <Input
          id="stripe-name"
          type="text"
          placeholder="John Doe"
          value={cardFields.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={cn(errors.name && "border-red-500")}
          disabled={isLoading || localLoading}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripe-card" className="text-white/80">
          Card Number
        </Label>
        <div className="relative">
          <Input
            id="stripe-card"
            type="text"
            placeholder="4242 4242 4242 4242"
            value={cardFields.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            className={cn(errors.number && "border-red-500", "pr-10")}
            disabled={isLoading || localLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-5 w-5 text-white/40" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
        {errors.number && <p className="text-xs text-red-500">{errors.number}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stripe-expiry" className="text-white/80">
            Expiry
          </Label>
          <Input
            id="stripe-expiry"
            type="text"
            placeholder="MM/YY"
            value={cardFields.expiry}
            onChange={(e) => handleInputChange("expiry", e.target.value)}
            className={cn(errors.expiry && "border-red-500")}
            disabled={isLoading || localLoading}
          />
          {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stripe-cvc" className="text-white/80">
            CVC
          </Label>
          <Input
            id="stripe-cvc"
            type="text"
            placeholder="123"
            value={cardFields.cvc}
            onChange={(e) => handleInputChange("cvc", e.target.value)}
            className={cn(errors.cvc && "border-red-500")}
            disabled={isLoading || localLoading}
          />
          {errors.cvc && <p className="text-xs text-red-500">{errors.cvc}</p>}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
        isLoading={isLoading || localLoading}
      >
        Pay ${amount.toFixed(2)} {currency}
      </Button>

      <p className="text-center text-xs text-white/40">
        Secured by Stripe. Your card details are encrypted.
      </p>
    </form>
  );
}

export default StripeCheckout;
