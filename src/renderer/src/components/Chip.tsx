import { cn } from "@renderer/utils";
import { cva, VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";

const chipStyles = cva(
  "px-2 py-1 rounded-2xl text-[0.6rem] text-white font-semibold max-w-32 w-auto text-center w-fit min-w-16 lowercase capitalize",
  {
    variants: {
      variant: {
        empty: "bg-slate-200 text-slate-500 border border-slate-500/40",
        success:
          "bg-fourth-green/20 text-primary-green border border-green-700/30",
        blue: "bg-blue-200/20 text-blue-400 border border-blue-700/30",
        orange: "bg-orange-200/20 text-orange-500 border border-orange-700/30",
        teal: "bg-teal-200/20 text-teal-400 border border-teal-700/30",
        lime: "bg-indigo-200/30 text-indigo-600 border border-indigo-700/40",
        cyan: "bg-cyan-200/20 text-cyan-400 border border-cyan-700/30",
        danger: "bg-red-300/20 text-red-700 border border-red-700/30",
        warning:
          "bg-third-orange/50 text-primary-orange border border-orange-700/30",
      },
      size: {
        sm: "h-4 px-2",
        lg: "h-9 px-12",
      },
      defaultVariants: {
        variant: "empty",
        size: "sm",
      },
    },
  },
);

interface ChipProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipStyles> {}

const Chip: React.FC<ChipProps> = ({
  className,
  variant,
  size,
  children,
  ...props
}) => {
  return (
    <div
      {...props}
      className={cn(
        chipStyles({ variant, size, className }),
        "pointer-events-none",
      )}
    >
      {children}
    </div>
  );
};

export { Chip };
