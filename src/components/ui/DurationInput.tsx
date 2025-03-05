import { cn } from "@/lib/utils";
import Label from "./Label";
import { useTranslations } from "next-intl";

interface DurationInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  unit: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function DurationInput({
  id,
  name,
  label,
  value,
  unit,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
}: DurationInputProps) {
  const t = useTranslations("dashboard");

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange("frequencyValue", newValue);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange("frequencyUnit", e.target.value);
  };

  return (
    <div className={className}>
      <Label title={label} error={error} required={required}>
        <div className="relative">
          <div className="flex items-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              id={id}
              name={name}
              value={value}
              onChange={handleValueChange}
              disabled={disabled}
              required={required}
              min={1}
              className={cn(
                "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-black [color:black]",
                error ? "border-red-300" : "border-gray-300",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "hover:border-gray-400",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                "pr-32"
              )}
            />
            <div className="absolute right-3 flex items-center">
              <select
                id={`${id}-unit`}
                name={`${name}-unit`}
                value={unit}
                onChange={handleUnitChange}
                disabled={disabled}
                className={cn(
                  "text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0",
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  error ? "text-red-500" : "text-gray-500"
                )}
              >
                <option value="minutes">
                  {t("bots.form.frequencyUnits.minutes")}
                </option>
                <option value="hours">
                  {t("bots.form.frequencyUnits.hours")}
                </option>
                <option value="days">
                  {t("bots.form.frequencyUnits.days")}
                </option>
                <option value="weeks">
                  {t("bots.form.frequencyUnits.weeks")}
                </option>
                <option value="months">
                  {t("bots.form.frequencyUnits.months")}
                </option>
              </select>
            </div>
          </div>
        </div>
      </Label>
    </div>
  );
}
