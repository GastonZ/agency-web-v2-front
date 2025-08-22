import React from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const base =
  [
    "w-full h-11 inline-flex items-center justify-center gap-2",
    "rounded-md text-sm font-medium",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "ring-offset-white dark:ring-offset-gray-900",
    "disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
  ].join(" ");

const variants: Record<Variant, string> = {
  // Negro en modo claro, blanco en modo oscuro
  primary: [
    "bg-black text-white hover:bg-black/90",
    "dark:bg-white dark:text-black dark:hover:bg-gray-200",
    "focus-visible:ring-gray-400 dark:focus-visible:ring-gray-600",
  ].join(" "),

  // Gris claro en modo claro, gris oscuro en modo oscuro
  secondary: [
    "bg-gray-100 text-gray-900 hover:bg-gray-200",
    "dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    "focus-visible:ring-gray-300 dark:focus-visible:ring-gray-600",
    "border border-gray-200 dark:border-gray-700",
  ].join(" "),
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading = false,
  children,
  className = "",
  ...props
}) => (
  <button
    className={`${base} ${variants[variant]} ${className}`}
    disabled={loading || props.disabled}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading ? (
      <span>Procesando...</span>
    ) : (
      children
    )}
  </button>
);
