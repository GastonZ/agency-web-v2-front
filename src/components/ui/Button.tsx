import React from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

const base =
  "w-full h-11 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-black text-white hover:bg-black/90",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading,
  children,
  className = "",
  ...props
}) => (
  <button
    className={`${base} ${variants[variant]} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? "Procesando..." : children}
  </button>
);
