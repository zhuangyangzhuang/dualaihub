"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PricingToggleProps {
  isYearly: boolean;
  onToggle: (isYearly: boolean) => void;
  yearlyDiscount?: number;
  className?: string;
}

export function PricingToggle({
  isYearly,
  onToggle,
  yearlyDiscount = 17,
  className,
}: PricingToggleProps) {
  const handleToggle = (checked: boolean) => {
    onToggle(checked);
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span
        className={cn(
          "text-sm font-medium transition-colors duration-300",
          !isYearly ? "text-white" : "text-white/50"
        )}
      >
        Monthly
      </span>
      <div className="relative flex items-center gap-3">
        <Switch
          checked={isYearly}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-[#0066ff]"
        />
        {isYearly && (
          <Badge
            variant="accent"
            className="absolute -top-8 left-1/2 -translate-x-1/2 animate-slide-down whitespace-nowrap shadow-lg shadow-[#00d4ff]/20"
          >
            Save {yearlyDiscount}%
          </Badge>
        )}
      </div>
      <span
        className={cn(
          "text-sm font-medium transition-colors duration-300",
          isYearly ? "text-white" : "text-white/50"
        )}
      >
        Yearly
      </span>
    </div>
  );
}

export default PricingToggle;
