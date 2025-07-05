import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-full border bg-background px-8 py-4 text-center font-semibold transition-all duration-300",
        className,
      )}
      {...props}
    >
      <span className="relative z-20 inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      <div className="absolute inset-0 z-10 flex translate-x-full items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRight className="h-4 w-4" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-all duration-300 group-hover:h-full group-hover:w-full group-hover:scale-150"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };