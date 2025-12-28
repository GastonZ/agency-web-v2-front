import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

/**
 * Textarea con estilo consistente con Input.tsx
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = "", disabled, ...props }, ref) => {
    const textareaId = id ?? props.name ?? `textarea-${Math.random().toString(36).slice(2)}`;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    const ringBase =
      "ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600";
    const errorRing = "ring-1 ring-red-500/60 focus:ring-2 focus:ring-red-500/70";
    const bgBase =
      "bg-white/70 hover:bg-white/90 dark:bg-neutral-900/70 dark:hover:bg-neutral-900/80";
    const textBase = "text-black placeholder:text-neutral-400 dark:text-white";
    const disabledCls =
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-inherit";

    return (
      <div className="space-y-1.5">
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            {label}
          </label>
        ) : null}

        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={!!error}
          className={cn(
            "w-full min-h-[110px] px-4 py-3 rounded-md resize-y",
            bgBase,
            textBase,
            disabledCls,
            error ? errorRing : ringBase,
            "focus:outline-none transition-colors",
            className
          )}
          {...props}
        />

        {hint && !error ? (
          <p id={hintId} className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
