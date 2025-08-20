import React, { forwardRef, useState } from "react";
import { Input } from "./Input";

type PasswordInputProps = React.ComponentProps<typeof Input>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          placeholder={props.placeholder ?? "********"}
          {...props}
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded text-xs text-gray-600 hover:bg-gray-100"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
