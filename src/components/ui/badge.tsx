import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/30",
        secondary: "bg-white/10 text-white/80 border border-white/20",
        accent: "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30",
        destructive: "bg-red-600/20 text-red-400 border border-red-600/30",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
        outline: "border border-white/20 text-white/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariant = "default" | "secondary" | "accent" | "destructive" | "success" | "outline";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
