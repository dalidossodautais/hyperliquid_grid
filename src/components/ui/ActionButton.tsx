import { ButtonHTMLAttributes } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger";
}

export default function ActionButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: ActionButtonProps) {
  const baseStyles = "cursor-pointer";
  const variantStyles = {
    primary: "text-blue-600 hover:text-blue-900",
    danger: "text-red-600 hover:text-red-900",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
