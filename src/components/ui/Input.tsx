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
}: InputProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        className={`appearance-none block w-full px-3 py-2 border ${
          error ? "border-red-300" : "border-gray-300"
        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-black [color:black] ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
