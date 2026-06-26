"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  content,
  children,
  className,
  position = "top",
}: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-white/20 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-white/20 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-white/20 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-white/20 border-y-transparent border-l-transparent",
  };

  return (
    <div className={cn("relative group inline-flex", className)}>
      {children}
      <div
        className={cn(
          "absolute z-50 px-3 py-2 text-xs font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg whitespace-pre-wrap max-w-xs",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200",
          positionClasses[position]
        )}
      >
        {content}
        <div
          className={cn(
            "absolute w-0 h-0 border-4",
            arrowClasses[position]
          )}
        />
      </div>
    </div>
  );
}