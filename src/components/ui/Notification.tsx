"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface NotificationProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type = "info",
  onClose,
  duration = 3000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white z-50",
        type === "success" && "bg-green-500",
        type === "error" && "bg-red-500",
        type === "info" && "bg-blue-500"
      )}
    >
      {message}
    </div>
  );
}
