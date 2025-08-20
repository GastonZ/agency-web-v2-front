import React from "react";

export const FormError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="text-red-600 text-sm mt-1"
    >
      {message}
    </div>
  );
};
