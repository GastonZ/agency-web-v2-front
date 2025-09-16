import * as React from "react";
import { cn } from "../../utils/helper";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export interface PunkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const PunkButton = React.forwardRef<HTMLButtonElement, PunkButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const sizes: Record<Size, string> = {
      sm: "h-8 px-3 text-xs rounded-lg",
      md: "h-9 px-4 text-sm rounded-lg",
      lg: "h-11 px-5 text-base rounded-xl",
    };

    const variants: Record<Variant, string> = {
      primary: cn(
        "text-white",
        "bg-gradient-to-b from-emerald-500 to-emerald-600",
        "hover:from-emerald-500/90 hover:to-emerald-600/90",
        "shadow-[0_8px_30px_rgba(16,185,129,0.35)]",
        "ring-1 ring-emerald-500/30",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      ),
      secondary: cn(
        "bg-white/20 dark:bg-neutral-900/30 backdrop-blur-xl",
        "border border-white/30 dark:border-white/10",
        "text-emerald-700 dark:text-emerald-300",
        "ring-1 ring-emerald-400/30 hover:ring-emerald-400/40",
        "hover:bg-emerald-400/20",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      ),
      ghost: cn(
        "bg-transparent",
        "text-neutral-700 dark:text-neutral-300",
        "hover:text-emerald-500",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
          sizes[size],
          variants[variant],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <span
            className={cn(
              "inline-block size-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent",
              variant === "secondary" && "border-emerald-500/60 border-t-transparent",
              variant === "ghost" && "border-emerald-500/60 border-t-transparent"
            )}
            aria-hidden="true"
          />
        )}
        {!loading && leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
        <span>{children}</span>
        {!loading && rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
      </button>
    );
  }
);

PunkButton.displayName = "PunkButton";
