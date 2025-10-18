"use client";

import { cn } from "@renderer/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";

const buttonStyles = cva(
  "h-9 rounded-md flex items-center justify-center disabled:opacity-60 disabled:pointer-events-none px-4 py-2 text-xs relative text-white border border-b-2 border-black/20 min-w-24 after:absolute after:left-0 after:top-0 after:h-px after:w-full after:scale-x-[94%] shadow-md after:rounded-md after:bg-gradient-to-b after:from-white/70 after:to-transparent",
  {
    variants: {
      variant: {
        success: "bg-primary hover:bg-primary/90 transition-all",
        blue: "bg-blue-500 hover:bg-blue-500/90 transition-all",
        error: "bg-red-500 hover:bg-danger/90 transition-all",
        outline:
          "bg-white border border-slate-300 opacity-100 text-slate-400 after:h-0 after:w-0",
      },
      defaultVariants: {
        variant: "default",
        size: "sm",
      },
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  isLoading,
  children,
  ...props
}) => {
  return (
    <button
      disabled={isLoading}
      {...props}
      className={cn(buttonStyles({ variant, className }))}
    >
      {isLoading ? (
        <span className="flex items-center gap-1">
          <span className="relative inline-block size-3.5 min-w-3.5 animate-rotateFull rounded-[50%] border border-white border-b-white/70 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent" />
          {children}
        </span>
      ) : (
        <>{children}</>
      )}
    </button>
  );
};

export { Button, buttonStyles };
