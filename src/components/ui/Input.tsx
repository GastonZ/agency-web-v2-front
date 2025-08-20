import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2)}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-800">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={!!error}
          className={`w-full h-12 rounded-md border border-gray-200 px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/80 ${className}`}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">{hint}</p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
