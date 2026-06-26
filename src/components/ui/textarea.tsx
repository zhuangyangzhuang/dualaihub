import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-white placeholder:text-white/40 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:ring-offset-2 focus:ring-offset-[#0a0a0f] focus:border-[#0066ff]/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
