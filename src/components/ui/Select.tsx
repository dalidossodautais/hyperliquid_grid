import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import Label from "./Label";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export default function Select({
  id,
  name,
  label,
  value,
  onChange,
  options,
  error,
  required,
  disabled,
  placeholder,
  className,
  isLoading,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption
    ? selectedOption.label
    : placeholder || "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    const event = {
      target: {
        name,
        value: optionValue,
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(event);
    setIsOpen(false);
  };

  return (
    <div className={`mb-4 ${className}`}>
      <Label title={label} error={error} required={required}>
        <div className="relative" ref={selectRef}>
          <div
            id={id}
            className={cn(
              "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-black [color:black] cursor-pointer",
              error ? "border-red-300" : "border-gray-300",
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && "hover:border-gray-400"
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <div className="flex justify-between items-center">
              <span
                className={cn(
                  "truncate",
                  !value && placeholder ? "text-gray-400" : ""
                )}
              >
                {displayValue}
              </span>
              {!isLoading && (
                <svg
                  className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0",
                    isOpen && "transform rotate-180"
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            </div>
          )}
          {isOpen && !disabled && (
            <div className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto bg-white">
              {options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "px-3 py-2 cursor-pointer text-black [color:black] hover:bg-gray-200 sm:text-sm bg-white",
                    option.value === value && "bg-gray-100"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex items-center">
                    <span className="truncate flex-1">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Label>
    </div>
  );
}
