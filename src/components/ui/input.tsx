import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-[#0a0a0f] px-4 py-2 text-sm text-white placeholder:text-white/40 transition-all duration-200",
          error
            ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
            : "border-white/10 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:ring-offset-2 focus:ring-offset-[#0a0a0f] focus:border-[#0066ff]/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
