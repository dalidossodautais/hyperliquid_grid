import { cn } from "@/lib/utils";

interface AlertProps {
  type?: "error" | "success" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

const Alert = ({ type = "error", children, className }: AlertProps) => {
  const baseStyles = "rounded-md p-3 text-sm";

  const variants = {
    error: "bg-red-50 border border-red-200 text-red-600",
    success: "bg-green-50 border border-green-200 text-green-600",
    warning: "bg-yellow-50 border border-yellow-200 text-yellow-600",
    info: "bg-blue-50 border border-blue-200 text-blue-600",
  };

  return (
    <div className={cn(baseStyles, variants[type], className)}>{children}</div>
  );
};

export default Alert;
