import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Size = "sm" | "md" | "lg";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: Size;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      id,
      className = "",
      prefix,
      suffix,
      size = "md",
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2)}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const heights: Record<Size, string> = {
      sm: "h-10 text-sm",
      md: "h-12 text-sm",
      lg: "h-[52px] text-base",
    };

    const paddingX = {
      sm: "px-3",
      md: "px-4",
      lg: "px-4",
    }[size];

    const pl = prefix ? "pl-10" : paddingX;
    const pr = suffix ? "pr-10" : paddingX;

    const ringBase =
      "ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600";
    const errorRing =
      "ring-1 ring-red-500/60 focus:ring-2 focus:ring-red-500/70";

    const bgBase =
      "bg-white/70 hover:bg-white/90 dark:bg-neutral-900/70 dark:hover:bg-neutral-900/80";
    const textBase = "text-black placeholder:text-neutral-400 dark:text-white";
    const rounded = "rounded-md";
    const disabledCls =
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-inherit";

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "relative group",
            "focus-within:ring-2 focus-within:ring-neutral-200 dark:focus-within:ring-neutral-700 rounded-md"
          )}
        >
          {prefix && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 dark:text-neutral-400 pointer-events-none">
              {prefix}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            aria-invalid={!!error}
            disabled={disabled}
            className={cn(
              "w-full",
              heights[size],
              pl,
              pr,
              rounded,
              bgBase,
              textBase,
              disabledCls,
              error ? errorRing : ringBase,
              "focus:outline-none transition-colors",
              className
            )}
            {...props}
          />

          {suffix && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 dark:text-neutral-400">
              {suffix}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
