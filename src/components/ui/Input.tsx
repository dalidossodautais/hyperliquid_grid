import { cn } from "@/lib/utils";
import Label from "./Label";
import { notify } from "./NotificationContainer";

interface InputProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "number" | "password" | "email";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  min?: number;
  step?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  unit?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  maxValue?: number;
  onMaxClick?: () => void;
}

export default function Input({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  min,
  step,
  disabled = false,
  placeholder,
  className = "",
  unit,
  onBlur,
  maxValue,
  onMaxClick,
}: InputProps) {
  const handleMaxClick = () => {
    if (maxValue === undefined || maxValue <= 0) {
      notify("No available balance", "error");
      return;
    }
    onMaxClick?.();
  };

  return (
    <div className={`mb-4 ${className}`}>
      <Label title={label} error={error} required={required}>
        <div className="relative">
          <div className="flex items-center">
            <input
              type={type}
              id={id}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              required={required}
              min={min}
              step={step}
              placeholder={placeholder}
              className={cn(
                "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-black [color:black]",
                error ? "border-red-300" : "border-gray-300",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "hover:border-gray-400",
                unit && "pr-24",
                type === "number" &&
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              )}
            />
            {unit && (
              <div className="absolute right-3 flex items-center space-x-2">
                {maxValue !== undefined && onMaxClick && (
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                    disabled={disabled}
                  >
                    max
                  </button>
                )}
                <span
                  className={cn(
                    "text-gray-500 text-sm",
                    disabled && "opacity-50"
                  )}
                >
                  {unit}
                </span>
              </div>
            )}
          </div>
        </div>
      </Label>
    </div>
  );
}
