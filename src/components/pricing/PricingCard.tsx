"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { PlanType } from "@/types/payment";

export interface PricingCardProps {
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number | string;
  features: string[];
  isYearly: boolean;
  isPopular?: boolean;
  isHot?: boolean;
  badgeText?: string;
  onCTAClick: () => void;
  ctaText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function PricingCard({
  name,
  description,
  monthlyPrice,
  yearlyPrice,
  credits,
  features,
  isYearly,
  isPopular = false,
  isHot = false,
  badgeText,
  onCTAClick,
  ctaText = "Get Started",
  isLoading = false,
  isDisabled = false,
  className,
}: PricingCardProps) {
  const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
  const billingPeriod = isYearly ? "/year" : "/month";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-[#2a2a3e] bg-[#0f0f1a] p-6 transition-all duration-300 hover:border-[#0066ff]/30",
        isPopular && "border-[#0066ff] shadow-lg shadow-[#0066ff]/10",
        className
      )}
    >
      {/* Gradient border overlay for popular plan */}
      {isPopular && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066ff]/10 to-[#00d4ff]/10" />
      )}

      {/* Badges */}
      <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
        {isPopular && (
          <Badge variant="default" className="shadow-lg shadow-[#0066ff]/20">
            Popular
          </Badge>
        )}
        {isHot && (
          <Badge variant="destructive" className="shadow-lg shadow-red-500/20">
            Hot
          </Badge>
        )}
        {badgeText && (
          <Badge variant="accent" className="shadow-lg shadow-[#00d4ff]/20">
            {badgeText}
          </Badge>
        )}
      </div>

      {/* Header */}
      <div className="mb-4 mt-2">
        <h3 className="text-xl font-bold text-white">{name}</h3>
        {description && (
          <p className="mt-1 text-sm text-white/60">{description}</p>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">
            ${displayPrice.toFixed(2)}
          </span>
          <span className="text-white/50">{billingPeriod}</span>
        </div>
        {isYearly && monthlyPrice > 0 && (
          <p className="mt-1 text-xs text-white/40">
            Monthly: ${monthlyPrice.toFixed(2)}
          </p>
        )}
      </div>

      {/* Credits */}
      <div className="mb-6 rounded-lg bg-white/5 p-3 text-center">
        <p className="text-sm font-medium text-white">
          <span className="text-[#00d4ff]">{typeof credits === 'number' ? credits.toLocaleString() : credits}</span>{" "}
          <span className="text-white/60">credits</span>
        </p>
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00d4ff]" />
            <span className="text-white/80">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={onCTAClick}
        disabled={isDisabled || isLoading}
        isLoading={isLoading}
        variant={isPopular ? "default" : "secondary"}
        className={cn(
          "w-full",
          isPopular && "bg-gradient-to-r from-[#0066ff] to-[#00d4ff]"
        )}
      >
        {ctaText}
      </Button>
    </div>
  );
}

export default PricingCard;
