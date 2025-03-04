import { ReactNode } from "react";

interface LabelProps {
  title: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export default function Label({
  title,
  children,
  error,
  required,
  className,
}: LabelProps) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      {title && (
        <div className="text-sm font-medium text-gray-700">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
