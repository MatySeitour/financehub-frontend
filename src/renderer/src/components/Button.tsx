"use client";

import { cn } from "@renderer/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";

const buttonStyles = cva(
  // "relative h-8 rounded-md z-10 p-2 px-4 text-xs min-w-24 text-white disabled:opacity-60 after:absolute after:left-0 after:top-0 after:h-full after:w-full before:absolute before:left-0 before:bottom-0 before:h-[3.5px] before:w-full before:bg-black/20 before:rounded-full overflow-hidden after:scale-x-[99.2%] after:scale-y-[92.5%] after:-z-10 after:rounded-md after:border-t after:border-white/70",
  "relative h-9 rounded-md flex items-center justify-center border-x-[1.5px] border-t-1 border-b-[3px] z-10 px-4 text-xs min-w-24 text-white disabled:opacity-60 after:absolute after:left-0 after:top-[0.5px] after:h-full after:w-full after:rounded-md",
  {
    variants: {
      variant: {
        success: "border-green-700 bg-primary",
        error: "bg-red-500 border-red-800",
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
    <button {...props} className={cn(buttonStyles({ variant, className }))}>
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
